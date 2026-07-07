import { type FormEvent, useMemo, useState } from 'react';
import { CamplyPicker } from '../components/CamplyPicker';
import type { RoutePage } from '../hooks/useRoute';
import type { SearchIntent } from '../types/camping';
import { SEARCH_INTENT_KEY, writeStored } from '../utils/storage';

const PROVIDERS = [
  { label: 'Ohio State Parks', value: 'OhioStateParks' },
  { label: 'Recreation.gov', value: 'RecreationDotGov' },
  { label: 'ReserveAmerica', value: 'Reserveamerica' },
  { label: 'USe-Direct', value: 'Usedirect' },
] as const;

interface HomePageProps { onNavigate: (page: RoutePage) => void; }

export default function HomePage({ onNavigate }: HomePageProps) {
  const [provider, setProvider] = useState('');
  const [destinationMode, setDestinationMode] = useState<'campground' | 'recreation-area'>('campground');
  const [campgroundIds, setCampgroundIds] = useState<string[]>([]);
  const [recreationAreaIds, setRecreationAreaIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tentOnly, setTentOnly] = useState(true);
  const [noHookups, setNoHookups] = useState(false);
  const [error, setError] = useState('');

  const appName = import.meta.env.VITE_APP_NAME ?? 'Moondock';

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(1, Math.round(ms / 86_400_000));
  }, [startDate, endDate]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!provider) { setError('Choose a provider before searching.'); return; }
    if (!startDate || !endDate) { setError('Add arrival and departure dates.'); return; }
    if (endDate <= startDate) { setError('Departure must be after arrival.'); return; }
    const ids = destinationMode === 'campground' ? campgroundIds : recreationAreaIds;
    if (ids.length === 0) {
      setError(destinationMode === 'campground' ? 'Pick a campground.' : 'Choose at least one recreation area.');
      return;
    }

    writeStored(SEARCH_INTENT_KEY, {
      provider,
      destinationMode,
      campgroundIds,
      recreationAreaIds,
      startDate,
      endDate,
      nights,
      equipment: [tentOnly ? 'Tent' : '', noHookups ? 'NoHookups' : ''].filter(Boolean),
    } satisfies SearchIntent);
    setError('');
    onNavigate('results');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-[var(--topbar-h)] pb-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="space-y-4 lg:pr-6">
            <p className="section-label">Wilderness camping</p>
            <h1 className="text-5xl font-semibold leading-tight text-[var(--text)] md:text-6xl">{appName}</h1>
            <p className="max-w-md text-lg text-[var(--text)]/75">
              Find your next wilderness campsite. Primitive, off-grid, forest-forward.
            </p>
          </div>

          <form onSubmit={onSubmit} className="content-card shadow-2xl">
            <div className="space-y-5">
              <div>
                <p className="section-label mb-3">Provider</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROVIDERS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setProvider(opt.value); setCampgroundIds([]); setRecreationAreaIds([]); }}
                      className={`btn btn-md w-full justify-start btn-secondary${provider === opt.value ? ' provider-btn-active' : ''}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex gap-1 rounded-[var(--radius)] bg-[var(--surface2)] p-1">
                  {(['campground', 'recreation-area'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setDestinationMode(mode);
                        // Reset both selections so a stale pick from the other
                        // mode can't survive the switch (issue #206).
                        setCampgroundIds([]);
                        setRecreationAreaIds([]);
                      }}
                      className={`flex-1 rounded-[calc(var(--radius)-0.125rem)] px-3 py-2 text-sm font-medium transition-colors ${
                        destinationMode === mode
                          ? 'bg-[var(--surface)] text-[var(--accent)]'
                          : 'text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {mode === 'campground' ? 'Campground' : 'Recreation Area'}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  {!provider && (
                    <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                      Select a provider first to load options
                    </div>
                  )}
                  {provider && destinationMode === 'campground' && (
                    <CamplyPicker
                      provider={provider}
                      searchType="campgrounds"
                      value={campgroundIds}
                      onChange={setCampgroundIds}
                      label="Campground"
                      placeholder="Browse or search campgrounds"
                      singleSelect
                      initQuery=""
                    />
                  )}
                  {provider && destinationMode === 'recreation-area' && (
                    <CamplyPicker
                      provider={provider}
                      searchType="recreation-areas"
                      value={recreationAreaIds}
                      onChange={setRecreationAreaIds}
                      label="Recreation area"
                      placeholder="Search recreation areas"
                      initQuery=""
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="arrive">Arrive</label>
                  <input id="arrive" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="field-label" htmlFor="depart">Depart</label>
                  <input id="depart" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {startDate && endDate && endDate > startDate && (
                  <p className="text-sm text-[var(--muted)]">{nights} night{nights === 1 ? '' : 's'}</p>
                )}
                <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--text)]">
                  <input type="checkbox" checked={tentOnly} onChange={e => setTentOnly(e.target.checked)} />
                  Tent
                </label>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--text)]">
                  <input type="checkbox" checked={noHookups} onChange={e => setNoHookups(e.target.checked)} />
                  No hookups
                </label>
              </div>

              {error && <p className="text-sm text-[var(--error)]">{error}</p>}

              <div className="form-actions">
                <button type="submit" data-testid="search-submit" className="btn btn-primary btn-lg w-full">
                  Find Campsites
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
  );
}
