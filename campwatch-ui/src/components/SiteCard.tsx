import type { CampsiteSearchRecord, FitScore } from '../types/camping';
import { alertToFacts, deriveSignals } from '../utils/deriveSignals';

interface SiteCardProps {
  result: CampsiteSearchRecord;
  onPlan: (result: CampsiteSearchRecord) => void;
}

function formatDates(checkIn: string, checkOut: string) {
  return `${checkIn} → ${checkOut}`;
}

function nightsBetween(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

const FIT_LABEL: Record<FitScore, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  UNKNOWN: 'Unknown',
};

const FIT_TONE: Record<FitScore, string> = {
  HIGH: 'bg-[rgba(90,138,60,0.18)] text-[var(--primary)]',
  MEDIUM: 'bg-[rgba(200,164,94,0.16)] text-[var(--accent)]',
  LOW: 'bg-[var(--surface2)] text-[var(--muted)]',
  UNKNOWN: 'bg-[var(--surface2)] text-[var(--muted)]',
};

interface SignalChipProps {
  label: string;
  score: FitScore;
  basis: string[];
}

function SignalChip({ label, score, basis }: SignalChipProps) {
  return (
    <div
      className={`rounded-[var(--radius)] px-3 py-2 ${FIT_TONE[score]}`}
      title={basis.join(' · ')}
    >
      <p className="text-xs uppercase tracking-[0.12em] opacity-80">{label}</p>
      <p className="text-sm font-semibold">{FIT_LABEL[score]}</p>
    </div>
  );
}

export default function SiteCard({ result, onPlan }: SiteCardProps) {
  const facts = alertToFacts(result);
  const signals = deriveSignals(facts);
  const nights = nightsBetween(result.checkIn, result.checkOut);

  return (
    <article className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{result.provider}</p>
          <h3 className="mt-1 text-xl font-semibold text-[var(--text)]">{result.campgroundName}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Site {result.siteId || 'Unknown'} · {facts.siteTypeLabel || 'Unknown type'}
          </p>
        </div>
        <div className="rounded-full bg-[rgba(200,164,94,0.14)] px-3 py-1 text-sm font-medium text-[var(--accent)]">
          Match {result.matchScore}
        </div>
      </div>

      {/* Facts: reported directly by the provider */}
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Facts · from provider</p>
      <dl className="mt-2 grid gap-3 text-sm text-[var(--text)] md:grid-cols-3">
        <div>
          <dt className="text-[var(--muted)]">Dates</dt>
          <dd>{formatDates(result.checkIn, result.checkOut)} · {nights} night{nights === 1 ? '' : 's'}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Reservable</dt>
          <dd>{result.isReservable ? 'Yes' : 'Unknown / check provider'}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Site type</dt>
          <dd>{facts.siteTypeLabel || 'Unknown'}</dd>
        </div>
      </dl>

      {/* Estimated signals: inferred, never presented as source data */}
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
        Estimated signals · inferred, verify with park
      </p>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <SignalChip label="Primitive fit" score={signals.primitiveFit} basis={signals.primitiveFitBasis} />
        <SignalChip label="Seclusion" score={signals.seclusionEstimate} basis={signals.seclusionBasis} />
        <SignalChip label="Forest bathing" score={signals.forestBathingFit} basis={signals.forestBathingBasis} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onPlan(result)}
          className="btn btn-primary btn-md"
        >
          Plan This Trip
        </button>
        {result.bookingUrl && (
          <a
            href={result.bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-md"
          >
            View Booking Page
          </a>
        )}
      </div>
    </article>
  );
}
