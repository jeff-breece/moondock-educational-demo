import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import SiteCard from '../components/SiteCard';
import Spinner from '../components/Spinner';
import type { RoutePage } from '../hooks/useRoute';
import type { CampsiteSearchRecord, SearchIntent, SelectedSite } from '../types/camping';
import { apiUrl } from '../utils/api';
import { SEARCH_INTENT_KEY, SELECTED_SITE_KEY, readStored, writeStored } from '../utils/storage';

interface ResultsPageProps {
  onNavigate: (page: RoutePage) => void;
}

interface BridgeJobStatus {
  id: string;
  status: string;
}

function nightsBetween(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

function isTerminalStatus(status: string) {
  const value = status.toLowerCase();
  return ['completed', 'done', 'finished', 'failed', 'error', 'stopped'].includes(value);
}

export default function ResultsPage({ onNavigate }: ResultsPageProps) {
  const [searchIntent] = useState<SearchIntent | null>(() => readStored<SearchIntent | null>(SEARCH_INTENT_KEY, null));
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState('Preparing search');
  const [loading, setLoading] = useState(Boolean(searchIntent));
  const [error, setError] = useState('');
  const [results, setResults] = useState<CampsiteSearchRecord[]>([]);
  const [providerFilter, setProviderFilter] = useState('All');
  const [siteTypeFilter, setSiteTypeFilter] = useState('All');
  const [minNightsFilter, setMinNightsFilter] = useState('');
  const [maxNightsFilter, setMaxNightsFilter] = useState('');

  useEffect(() => {
    if (!searchIntent) {
      setLoading(false);
      return;
    }

    let intervalId: number | undefined;
    let timeoutId: number | undefined;
    let finalFetchId: number | undefined;
    let cancelled = false;

    // Scope this results view to the current search run. Subtract a small buffer
    // to absorb minor client/server clock skew so we never miss a fresh row. #200
    const searchStartedAt = new Date(Date.now() - 10_000).toISOString();

    const fetchResults = async () => {
      const response = await fetch(apiUrl(
        `/api/campsites?pageSize=50&provider=${encodeURIComponent(searchIntent.provider)}&since=${encodeURIComponent(searchStartedAt)}`,
      ));
      if (!response.ok) throw new Error('Could not load campsite results.');
      const data = await response.json() as { items?: CampsiteSearchRecord[] };
      // Server already scoped rows to this run via ?since=. Prefer exact-date
      // matches, but fall back to all run rows (never to prior-run rows).
      const runMatches = (data.items ?? []).filter(item => item.provider === searchIntent.provider);
      const exactMatches = runMatches.filter(item => item.checkIn === searchIntent.startDate && item.checkOut === searchIntent.endDate);
      if (!cancelled) {
        setResults(exactMatches.length > 0 ? exactMatches : runMatches);
      }
    };

    const stopPolling = () => {
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };

    const finishRun = () => {
      stopPolling();
      // Webhook delivery can lag the job reaching a terminal state, so do one
      // more fetch shortly after completion to catch late-arriving rows. #200
      finalFetchId = window.setTimeout(() => {
        if (cancelled) return;
        void fetchResults().catch(() => undefined).finally(() => {
          if (!cancelled) setLoading(false);
        });
      }, 2_000);
      setLoading(false);
    };

    const pollStatus = async (currentJobId: string) => {
      const response = await fetch(apiUrl('/api/camply/status'));
      if (!response.ok) throw new Error('Could not check job status.');
      const data = await response.json() as { jobs?: BridgeJobStatus[] };
      const currentJob = (data.jobs ?? []).find(job => job.id === currentJobId);
      if (!cancelled) {
        const nextStatus = currentJob?.status ?? 'Completed';
        setJobStatus(nextStatus);
        if (!currentJob || isTerminalStatus(nextStatus)) {
          finishRun();
        }
      }
    };

    const runPoll = async (currentJobId: string) => {
      await Promise.all([pollStatus(currentJobId), fetchResults()]);
    };

    void (async () => {
      try {
        setJobStatus('Starting campsite search');
        const response = await fetch(apiUrl('/api/camply/jobs'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileName: 'Moondock Search',
            provider: searchIntent.provider,
            campgroundIds: searchIntent.campgroundIds,
            recreationAreaIds: searchIntent.recreationAreaIds,
            startDate: searchIntent.startDate,
            endDate: searchIntent.endDate,
            nights: searchIntent.nights,
            equipment: searchIntent.equipment,
            daemon: false,
          }),
        });
        if (!response.ok) throw new Error('Could not start search job.');
        const data = await response.json() as { jobId?: string; status?: string };
        const nextJobId = data.jobId ?? '';
        if (!nextJobId) throw new Error('Search job did not return an id.');
        if (cancelled) return;
        setJobId(nextJobId);
        setJobStatus(data.status ?? 'Running');
        await runPoll(nextJobId);
        intervalId = window.setInterval(() => {
          void runPoll(nextJobId);
        }, 5_000);
        timeoutId = window.setTimeout(() => {
          stopPolling();
          setLoading(false);
          setJobStatus('Completed');
        }, 60_000);
      } catch (fetchError) {
        if (!cancelled) {
          setError((fetchError as Error).message || 'Unable to load results.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
      if (finalFetchId) window.clearTimeout(finalFetchId);
    };
  }, [searchIntent]);

  const visibleResults = useMemo(() => {
    return results.filter(result => {
      const resultNights = nightsBetween(result.checkIn, result.checkOut);
      const matchesProvider = providerFilter === 'All' || result.provider === providerFilter;
      const matchesSiteType = siteTypeFilter === 'All' || result.siteType === siteTypeFilter;
      const matchesMin = !minNightsFilter || resultNights >= Number(minNightsFilter);
      const matchesMax = !maxNightsFilter || resultNights <= Number(maxNightsFilter);
      return matchesProvider && matchesSiteType && matchesMin && matchesMax;
    });
  }, [maxNightsFilter, minNightsFilter, providerFilter, results, siteTypeFilter]);

  const siteTypes = [...new Set(results.map(result => result.siteType).filter(Boolean))];
  const providers = [...new Set(results.map(result => result.provider).filter(Boolean))];

  const planTrip = (result: CampsiteSearchRecord) => {
    const payload: SelectedSite = {
      ...result,
      campgroundId: searchIntent?.campgroundIds[0],
      recAreaId: searchIntent?.recreationAreaIds[0],
      nights: nightsBetween(result.checkIn, result.checkOut),
    };
    writeStored(SELECTED_SITE_KEY, payload);
    onNavigate('reserve');
  };

  return (
    <PageShell width="medium">
      {!searchIntent && (
        <div className="empty-state">
          <h1 className="page-title mb-2">No search ready</h1>
          <p className="mb-6 text-sm text-[var(--muted)]">Start from Home to search for campsites.</p>
          <button type="button" onClick={() => onNavigate('home')} className="btn btn-primary btn-md">
            Back to Home
          </button>
        </div>
      )}

      {searchIntent && (
        <>
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div>
              <p className="section-label mb-1">Search Results</p>
              <h1 className="page-title">Available Campsites</h1>
              <p className="page-subtitle">{searchIntent.provider} · {searchIntent.startDate} → {searchIntent.endDate}</p>
            </div>
            <button type="button" onClick={() => onNavigate('home')} className="btn btn-secondary btn-sm">
              ← New Search
            </button>
          </div>

          {!loading && results.length > 0 && (
            <div className="sticky top-[var(--topbar-h)] z-10 mb-6 rounded-b-[1rem] border border-[var(--border)] bg-[var(--surface)] px-5 pb-4 pt-3 shadow-lg flex flex-wrap gap-3">
              <div className="w-full">
                <p className="section-label">{visibleResults.length === results.length ? `${results.length} available site${results.length === 1 ? '' : 's'}` : `${visibleResults.length} of ${results.length} sites`}</p>
              </div>
              <label className="min-w-[12rem] flex-1 text-sm">
                <span className="field-label">Provider</span>
                <select value={providerFilter} onChange={event => setProviderFilter(event.target.value)}>
                  <option value="All">All</option>
                  {providers.map(provider => <option key={provider} value={provider}>{provider}</option>)}
                </select>
              </label>
              <label className="min-w-[12rem] flex-1 text-sm">
                <span className="field-label">Site type</span>
                <select value={siteTypeFilter} onChange={event => setSiteTypeFilter(event.target.value)}>
                  <option value="All">All</option>
                  {siteTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="min-w-[10rem] flex-1 text-sm">
                <span className="field-label">Min nights</span>
                <input type="number" min={1} placeholder="Any" value={minNightsFilter} onChange={event => setMinNightsFilter(event.target.value)} />
              </label>
              <label className="min-w-[10rem] flex-1 text-sm">
                <span className="field-label">Max nights</span>
                <input type="number" min={1} placeholder="Any" value={maxNightsFilter} onChange={event => setMaxNightsFilter(event.target.value)} />
              </label>
            </div>
          )}

          {loading && (
            <div role="status" className="flex flex-col items-center gap-4 py-16 text-[var(--muted)]">
              <Spinner />
              <p className="text-sm">{jobStatus}…</p>
              {jobId && <p className="text-xs opacity-60">Job {jobId}</p>}
            </div>
          )}

          {error && !loading && <div className="flash-error mb-6">{error}</div>}

          {!loading && visibleResults.length === 0 && !error && (
            <div className="empty-state">
              <h2 className="page-title mb-2">No open campsites right now</h2>
              <p className="mx-auto mb-6 max-w-md text-sm text-[var(--muted)]">
                Camply checked {searchIntent.provider} for {searchIntent.startDate} → {searchIntent.endDate} and
                found no availability. Popular campgrounds are often fully booked — try different dates, a nearby
                recreation area, or check back later as cancellations open up.
              </p>
              <button type="button" onClick={() => onNavigate('home')} className="btn btn-primary btn-md">
                New Search
              </button>
            </div>
          )}

          {!loading && visibleResults.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleResults.map(result => (
                <SiteCard key={result.id} result={result} onPlan={planTrip} />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
