interface TripCardProps {
  title: string;
  destination: string;
  dates: string;
  status: string;
  kind?: 'trip' | 'outing';
  logLabel?: string;
  onViewLog: () => void;
  onEdit: () => void;
  editLabel?: string;
}

function statusClasses(status: string) {
  switch (status) {
    case 'Completed':
      return 'bg-[rgba(74,154,90,0.16)] text-[var(--success)]';
    case 'Booked':
      return 'bg-[rgba(200,164,94,0.16)] text-[var(--accent)]';
    case 'Cancelled':
      return 'bg-[rgba(192,90,69,0.16)] text-[var(--error)]';
    default:
      return 'bg-[rgba(90,138,60,0.16)] text-[var(--primary)]';
  }
}

export default function TripCard({
  title,
  destination,
  dates,
  status,
  kind,
  logLabel = 'View Log',
  onViewLog,
  onEdit,
  editLabel = 'Edit',
}: TripCardProps) {
  return (
    <article className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
            {kind && (
              <span className="rounded-full bg-[var(--surface2)] px-2 py-0.5 text-xs text-[var(--muted)]">
                {kind === 'outing' ? 'journal' : 'plan'}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--muted)]">{destination}</p>
          <p className="mt-2 text-sm text-[var(--text)]">{dates}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClasses(status)}`}>{status}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onViewLog}
          className="btn btn-secondary btn-md"
        >
          {logLabel}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="btn btn-ghost btn-md"
        >
          {editLabel}
        </button>
      </div>
    </article>
  );
}
