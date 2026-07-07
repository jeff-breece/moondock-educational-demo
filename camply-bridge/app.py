"""
camply-bridge — production Flask service for CampWatch v2.

Wraps the camply CLI, managing long-running daemon search jobs and forwarding
webhook payloads to campwatch-api.  Camply sends availability results directly
to WEBHOOK_URL (set per-job as a subprocess env var), so the bridge's role is
purely job lifecycle management.

Camply webhook payload (WebhookBody):
  { "campsites": [AvailableCampsite, ...], "timestamp": "<iso8601>" }

Camply CLI:
  camply --provider <PROVIDER> campsites
      --campground <ID> [--campground <ID> ...]
      --start-date YYYY-MM-DD --end-date YYYY-MM-DD
      --nights N [--equipment tent ...]
      --notifications webhook
      --search-forever          (daemon mode)
"""

import logging
import os
import re
import signal
import subprocess
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request

# ---------------------------------------------------------------------------
# Structured JSON logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":%(message)s}',
)
logger = logging.getLogger("camply-bridge")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CAMPWATCH_API_URL: str = os.environ.get("CAMPWATCH_API_URL", "http://localhost:8080")
WEBHOOK_ENDPOINT: str = f"{CAMPWATCH_API_URL}/api/webhook/camply"
JOB_LOG_DIR: Path = Path(os.environ.get("JOB_LOG_DIR", "/tmp/campwatch-jobs"))
JOB_LOG_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Job registry
# ---------------------------------------------------------------------------
_jobs: dict[str, dict[str, Any]] = {}
_lock = threading.Lock()

# ---------------------------------------------------------------------------
# Search result cache  (key → (unix_ts, [items]))
# ---------------------------------------------------------------------------
_search_cache: dict[str, tuple[float, list[dict]]] = {}
_CACHE_TTL = 3600.0  # 1 hour

def _cached_get(key: str) -> list[dict] | None:
    entry = _search_cache.get(key)
    if entry and (time.time() - entry[0]) < _CACHE_TTL:
        return entry[1]
    return None

def _cache_set(key: str, data: list[dict]) -> None:
    _search_cache[key] = (time.time(), data)

app = Flask(__name__)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Camply table parser
# ---------------------------------------------------------------------------

_ANSI_RE = re.compile(r'\x1b\[[0-9;]*[mGKHFJABCDHf]')


def _strip_ansi(text: str) -> str:
    return _ANSI_RE.sub('', text)


def _parse_camply_log(output: str, marker: str) -> list[dict[str, str]]:
    """Parse camply log-format output (INFO lines with emoji markers).

    Camply does NOT emit a Rich table for campground/recreation-area discovery;
    it logs structured INFO messages like:
      [timestamp] INFO  ⛰  Park Name (#RecAreaID) - 🏕  Campground Name (#CampID)

    Multi-line entries occur when Rich wraps long names; continuation lines are
    indented with leading whitespace.

    Args:
        output:  Full stdout from camply subprocess.
        marker:  Emoji to search for:  '🏕' for campgrounds,  '⛰' for rec-areas.
    Returns:
        [{id: str, name: str}]
    """
    ts_re   = re.compile(r'^\[[\d\-: ]+\]\s+\w+\s+(.*)$')
    pat     = re.compile(re.escape(marker) + r'\s+(.*?)\s*\(#(\d+)\)')

    # --- Step 1: join wrapped continuation lines into single logical lines ---
    normalized: list[str] = []
    parts: list[str] = []

    for raw_line in output.splitlines():
        clean = _strip_ansi(raw_line).rstrip()
        ts_m  = ts_re.match(clean)
        if ts_m:
            if parts:
                normalized.append(' '.join(parts))
            parts = [ts_m.group(1).strip()]
        elif clean.startswith(' ') and parts:
            cont = clean.strip()
            if cont:
                parts.append(cont)

    if parts:
        normalized.append(' '.join(parts))

    # --- Step 2: extract first marker match from each logical line -----------
    results: list[dict[str, str]] = []
    for line in normalized:
        m = pat.search(line)
        if m:
            name = m.group(1).strip()
            id_  = m.group(2)
            if name and id_:
                results.append({"id": id_, "name": name})

    return results


def _run_camply_search(args: list[str]) -> subprocess.CompletedProcess:
    """Run a camply discovery command with plain-text output."""
    env = {
        **os.environ,
        "NO_COLOR": "1",
        "FORCE_COLOR": "0",
        "TERM": "dumb",
    }
    return subprocess.run(
        args,
        capture_output=True,
        text=True,
        timeout=45,
        env=env,
    )


def _build_camply_cmd(job: dict[str, Any]) -> list[str]:
    """Translate a job spec into a camply CLI invocation.

    Supports two search modes (may be combined):
      - campground_ids    → --campground <id> (specific sites)
      - recreation_area_ids → --recreation-area <id> (wide-area search)

    Rate-limiting note:
      --search-forever polls at CAMPLY_POLLING_INTERVAL_IN_MINUTES (default 10 min).
      Set CAMPLY_POLLING_INTERVAL_IN_MINUTES in the container env to tune cadence.
      Recreation.gov and ODNR enforce per-IP rate limits; camply respects these by
      default. Do not lower the polling interval below 5 minutes for any live provider.
    """
    cmd = ["camply", "--provider", job["provider"], "campsites"]

    for cid in job.get("campground_ids") or []:
        cmd += ["--campground", str(cid)]

    for rid in job.get("recreation_area_ids") or []:
        cmd += ["--recreation-area", str(rid)]

    cmd += ["--start-date", job["start_date"]]
    cmd += ["--end-date", job["end_date"]]
    cmd += ["--nights", str(job.get("nights") or 1)]

    # camply's --equipment takes TWO values: <EquipmentType> <MinLength(ft)>.
    # Passing only the type makes camply swallow the following flag as the
    # missing second value, corrupting the whole command (e.g. it would eat
    # --notifications, leaving "webhook" as an orphan positional). Always pass
    # a min length of 0 (= any). equipment may be null from the .NET serializer.
    for equip in job.get("equipment") or ["Tent"]:
        cmd += ["--equipment", equip, "0"]

    cmd += ["--notifications", "webhook"]

    # Without this, camply suppresses the initial batch when >5 matches are
    # found on the first search — for one-shot UI searches that would silently
    # drop most results. We always want the full first-search result set.
    cmd += ["--notify-first-try"]

    if job.get("daemon", True):
        cmd += ["--search-forever"]
    else:
        cmd += ["--search-once"]

    return cmd


def _monitor_job(job_id: str, process: subprocess.Popen) -> None:
    """Background thread: watches process and marks job terminal when it exits."""
    process.wait()
    with _lock:
        job = _jobs.get(job_id)
        if job and job["status"] == "running":
            job["status"] = "failed" if process.returncode not in (0, -signal.SIGTERM) else "stopped"
            job["ended_at"] = _now_iso()
            logger.info('"Job %s exited with rc=%d — status=%s"', job_id, process.returncode, job["status"])


def _start_subprocess(job_id: str, job: dict[str, Any]) -> None:
    """Launch camply as a child process and wire up the monitor thread."""
    cmd = _build_camply_cmd(job)
    log_path = JOB_LOG_DIR / f"{job_id}.log"

    env = {
        **os.environ,
        "WEBHOOK_URL": f"{WEBHOOK_ENDPOINT}?provider={job.get('provider', 'RecreationDotGov')}",
        "NO_COLOR": "1",
    }

    try:
        log_file = open(log_path, "w")  # noqa: WPS515 — intentional long-lived FD
        process = subprocess.Popen(
            cmd,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            env=env,
            start_new_session=True,  # detach from bridge's process group
        )
        with _lock:
            job["pid"] = process.pid
            job["status"] = "running"
            job["log_file"] = str(log_path)

        logger.info('"Started job %s pid=%d cmd=%s"', job_id, process.pid, " ".join(cmd))

        monitor = threading.Thread(target=_monitor_job, args=(job_id, process), daemon=True)
        monitor.start()

        # Store process handle for later termination
        job["_process"] = process

    except FileNotFoundError:
        with _lock:
            job["status"] = "failed"
            job["error"] = "camply not found — is it installed in this container?"
        logger.error('"camply binary not found for job %s"', job_id)

    except Exception as exc:
        with _lock:
            job["status"] = "failed"
            job["error"] = str(exc)
        logger.error('"Failed to start job %s: %s"', job_id, exc)


def _safe_job_view(job: dict[str, Any]) -> dict[str, Any]:
    """Return a JSON-serialisable view of a job (no internal _keys or process handles)."""
    return {k: v for k, v in job.items() if not k.startswith("_")}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    with _lock:
        running = sum(1 for j in _jobs.values() if j["status"] == "running")
    return jsonify({"status": "ok", "service": "camply-bridge", "jobs": running})


@app.get("/camply/status")
def status():
    with _lock:
        jobs_view = [_safe_job_view(j) for j in _jobs.values()]
    return jsonify({
        "jobs": jobs_view,
        "api_url": CAMPWATCH_API_URL,
        "webhook_endpoint": WEBHOOK_ENDPOINT,
    })


@app.post("/camply/jobs")
def start_job():
    """Start a new daemon search job.

    Body (all except start_date / end_date are optional):
      {
        "profile_name": "moondock",
        "provider": "OhioStateParks",
        "campground_ids": [554],
        "start_date": "2026-08-01",
        "end_date": "2026-12-31",
        "nights": 2,
        "equipment": ["tent"],
        "daemon": true
      }
    """
    body: dict[str, Any] = request.get_json(force=True, silent=True) or {}

    # Validate required fields
    missing = [f for f in ("start_date", "end_date") if not body.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    campground_ids = body.get("campground_ids") or []
    recreation_area_ids = body.get("recreation_area_ids") or []
    if not campground_ids and not recreation_area_ids:
        return jsonify({"error": "Provide campground_ids or recreation_area_ids (or both)"}), 400

    job_id = str(uuid.uuid4())[:8]
    job: dict[str, Any] = {
        "id": job_id,
        "profile_name": body.get("profile_name", "default"),
        "provider": body.get("provider", "RecreationDotGov"),
        "campground_ids": campground_ids,
        "recreation_area_ids": recreation_area_ids,
        "start_date": body["start_date"],
        "end_date": body["end_date"],
        "nights": int(body.get("nights", 1)),
        "equipment": body.get("equipment", ["tent"]),
        "daemon": bool(body.get("daemon", True)),
        "status": "starting",
        "pid": None,
        "started_at": _now_iso(),
        "ended_at": None,
        "log_file": None,
        "error": None,
    }

    with _lock:
        _jobs[job_id] = job

    # Launch in background so POST returns immediately
    threading.Thread(target=_start_subprocess, args=(job_id, job), daemon=True).start()

    logger.info('"Job %s created profile=%s provider=%s campgrounds=%s"',
                job_id, job["profile_name"], job["provider"], campground_ids)
    return jsonify({"job_id": job_id, "status": "starting"}), 202


@app.delete("/camply/jobs/<job_id>")
def stop_job(job_id: str):
    """Gracefully stop a running job (SIGTERM, then SIGKILL after 5 s)."""
    with _lock:
        job = _jobs.get(job_id)

    if job is None:
        return jsonify({"error": "job not found"}), 404

    process: subprocess.Popen | None = job.get("_process")
    if process is None or job["status"] != "running":
        return jsonify({"job_id": job_id, "status": job["status"], "note": "not running"}), 200

    try:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()

        with _lock:
            job["status"] = "stopped"
            job["ended_at"] = _now_iso()

        logger.info('"Job %s stopped"', job_id)
        return jsonify({"job_id": job_id, "status": "stopped"})

    except Exception as exc:
        logger.error('"Error stopping job %s: %s"', job_id, exc)
        return jsonify({"error": str(exc)}), 500


@app.post("/camply/request")
def one_shot():
    """One-shot camply invocation (backward compat with prototype).

    Runs camply with --search-once (no --search-forever), waits up to
    60 s for completion, and returns the job ID and final status.
    """
    body: dict[str, Any] = request.get_json(force=True, silent=True) or {}

    missing = [f for f in ("start_date", "end_date", "campground_ids") if not body.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    job_id = str(uuid.uuid4())[:8]
    job: dict[str, Any] = {
        "id": job_id,
        "profile_name": body.get("profile_name", "one-shot"),
        "provider": body.get("provider", "RecreationDotGov"),
        "campground_ids": body["campground_ids"],
        "start_date": body["start_date"],
        "end_date": body["end_date"],
        "nights": int(body.get("nights", 1)),
        "equipment": body.get("equipment", ["tent"]),
        "daemon": False,
        "status": "starting",
        "pid": None,
        "started_at": _now_iso(),
        "ended_at": None,
        "log_file": None,
        "error": None,
    }

    with _lock:
        _jobs[job_id] = job

    _start_subprocess(job_id, job)

    process: subprocess.Popen | None = job.get("_process")
    if process:
        try:
            process.wait(timeout=60)
        except subprocess.TimeoutExpired:
            process.kill()
            with _lock:
                job["status"] = "failed"
                job["error"] = "timed out after 60 s"

    return jsonify({"job_id": job_id, "status": job["status"]}), 202


# ---------------------------------------------------------------------------
# Discovery / search endpoints (used by the UI pickers)
# ---------------------------------------------------------------------------

@app.get("/camply/search/campgrounds")
def search_campgrounds():
    """Search campgrounds by name for a given provider.

    For known providers, an empty query uses a broad seed term to enable
    initial dropdown population (dependent-select UX). Results cached 1 h.

    Query params:
      provider  — e.g. OhioStateParks, RecreationDotGov  (default: OhioStateParks)
      q         — search string; if blank, uses provider default seed term
    Response:
      {"items": [{"id": "458", "name": "Hocking Hills Camp Sites 1-93"}], "provider": "..."}
    """
    provider = request.args.get("provider", "OhioStateParks")
    query    = request.args.get("q", "").strip()

    # Provider-specific seed queries for the "load all / auto-populate" case
    _SEED_QUERIES: dict[str, str] = {
        "OhioStateParks": "State",        # matches "X State Park" campgrounds
        "RecreationDotGov": "Campground", # broad match for large provider
    }

    if not query:
        seed = _SEED_QUERIES.get(provider, "")
        if not seed:
            return jsonify({"items": [], "provider": provider,
                            "hint": "Type to search campgrounds by name"})
        query = seed

    cache_key = f"campgrounds:{provider}:{query.lower()}"
    items = _cached_get(cache_key)

    if items is None:
        try:
            result = _run_camply_search(
                ["camply", "--provider", provider, "campgrounds", "--search", query]
            )
            items = _parse_camply_log(result.stdout, "🏕")
            _cache_set(cache_key, items)
            logger.info('"Campground search: provider=%s q=%s found=%d"', provider, query, len(items))
        except subprocess.TimeoutExpired:
            logger.warning('"Campground search timed out: provider=%s q=%s"', provider, query)
            return jsonify({"items": [], "provider": provider, "error": "Search timed out"}), 200
        except Exception as exc:
            logger.error('"Campground search failed: provider=%s q=%s err=%s"', provider, query, exc)
            return jsonify({"items": [], "provider": provider, "error": str(exc)}), 200

    return jsonify({"items": items, "provider": provider})


@app.get("/camply/search/recreation-areas")
def search_recreation_areas():
    """Search recreation areas by keyword for a given provider.

    Query params:
      provider  — e.g. RecreationDotGov  (default: RecreationDotGov)
      q         — search string (2+ chars required)
    Response:
      {"items": [{"id": "335", "name": "Burr Oak Lake, OH"}], "provider": "..."}
    """
    provider = request.args.get("provider", "RecreationDotGov")
    query    = request.args.get("q", "").strip()

    if not query:
        return jsonify({"items": [], "provider": provider})

    cache_key = f"rec-areas:{provider}:{query.lower()}"
    items = _cached_get(cache_key)

    if items is None:
        try:
            result = _run_camply_search(
                ["camply", "--provider", provider, "recreation-areas", "--search", query]
            )
            items = _parse_camply_log(result.stdout, "⛰")
            _cache_set(cache_key, items)
            logger.info('"Rec-area search: provider=%s q=%s found=%d"', provider, query, len(items))
        except subprocess.TimeoutExpired:
            logger.warning('"Rec-area search timed out: provider=%s q=%s"', provider, query)
            return jsonify({"items": [], "provider": provider, "error": "Search timed out"}), 200
        except Exception as exc:
            logger.error('"Rec-area search failed: provider=%s q=%s err=%s"', provider, query, exc)
            return jsonify({"items": [], "provider": provider, "error": str(exc)}), 200

    return jsonify({"items": items, "provider": provider})


# ---------------------------------------------------------------------------
# Entry point (dev only — gunicorn in production)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8088))
    app.run(host="0.0.0.0", port=port)
