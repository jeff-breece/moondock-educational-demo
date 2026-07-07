import { useState } from 'react';
import ChecklistBuilder from '../components/ChecklistBuilder';
import PageShell from '../components/PageShell';
import type { RoutePage } from '../hooks/useRoute';
import type { ChecklistItem, SearchIntent, SelectedSite, TripPlan } from '../types/camping';
import { apiUrl } from '../utils/api';
import {
  FLASH_KEY,
  SEARCH_INTENT_KEY,
  SELECTED_SITE_KEY,
  TRIP_DRAFT_KEY,
  clearStored,
  readStored,
  writeStored,
} from '../utils/storage';

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { text: 'Reserve campsite online', done: false },
  { text: 'Check weather forecast 2 days before', done: false },
  { text: 'Pack tent, sleeping bag, sleeping pad', done: false },
  { text: 'Pack camp stove and fuel', done: false },
  { text: 'Pack water filter / purification tabs', done: false },
  { text: 'Pack headlamp + extra batteries', done: false },
  { text: "Purchase firewood on-site (don't transport)", done: false },
  { text: 'Review campground rules and check-in time', done: false },
  { text: 'Download offline maps for the area', done: false },
];

interface ReservePageProps {
  onNavigate: (page: RoutePage) => void;
}

function parseChecklistJson(value?: string) {
  if (!value) return DEFAULT_CHECKLIST;
  try {
    const parsed = JSON.parse(value) as Array<{ text?: string; done?: boolean } | string>;
    const normalized = parsed
      .map(item => typeof item === 'string'
        ? { text: item, done: false }
        : { text: item.text ?? '', done: Boolean(item.done) })
      .filter(item => item.text);
    return normalized.length > 0 ? normalized : DEFAULT_CHECKLIST;
  } catch {
    return DEFAULT_CHECKLIST;
  }
}

function buildInitialTrip(selectedSite: SelectedSite | null, draft: TripPlan | null, intent: SearchIntent | null): TripPlan {
  if (draft) {
    return draft;
  }

  return {
    name: selectedSite?.campgroundName ? `${selectedSite.campgroundName} getaway` : '',
    provider: selectedSite?.provider ?? intent?.provider ?? '',
    campgroundId: selectedSite?.campgroundId ?? intent?.campgroundIds[0] ?? '',
    campgroundName: selectedSite?.campgroundName ?? '',
    recAreaId: selectedSite?.recAreaId ?? intent?.recreationAreaIds[0] ?? '',
    recAreaName: selectedSite?.recAreaName ?? '',
    startDate: selectedSite?.checkIn ?? intent?.startDate ?? '',
    endDate: selectedSite?.checkOut ?? intent?.endDate ?? '',
    nights: selectedSite?.nights ?? intent?.nights ?? 2,
    status: 'Planned',
    notes: '',
    checklistJson: JSON.stringify(DEFAULT_CHECKLIST),
  };
}

export default function ReservePage({ onNavigate }: ReservePageProps) {
  const selectedSite = readStored<SelectedSite | null>(SELECTED_SITE_KEY, null);
  const draft = readStored<TripPlan | null>(TRIP_DRAFT_KEY, null);
  const intent = readStored<SearchIntent | null>(SEARCH_INTENT_KEY, null);

  const [trip, setTrip] = useState<TripPlan>(() => buildInitialTrip(selectedSite, draft, intent));
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => parseChecklistJson(draft?.checklistJson));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const destination = trip.campgroundName || trip.recAreaName;

  const setDestination = (value: string) => {
    setTrip(current => ({
      ...current,
      campgroundName: current.campgroundName || !current.recAreaName ? value : current.campgroundName,
      recAreaName: current.campgroundName ? current.recAreaName : value,
    }));
  };

  const saveTrip = async () => {
    if (!trip.name.trim() || !trip.provider || !trip.startDate || !trip.endDate) {
      setError('Trip name, provider, and dates are required.');
      return;
    }

    setSaving(true);
    setError('');

    const payload: TripPlan = {
      ...trip,
      campgroundName: trip.campgroundName || destination,
      recAreaName: trip.campgroundName ? trip.recAreaName : destination,
      checklistJson: JSON.stringify(checklist),
    };

    const isEditing = Boolean(trip.id);
    const endpoint = isEditing ? `/api/trips/${trip.id}` : '/api/trips';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl(endpoint), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Could not save trip plan.');
      writeStored(FLASH_KEY, isEditing ? 'Trip updated.' : 'Trip plan saved.');
      clearStored(TRIP_DRAFT_KEY);
      clearStored(SELECTED_SITE_KEY);
      onNavigate('history');
    } catch (saveError) {
      setError((saveError as Error).message || 'Could not save trip plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell width="medium">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div>
          <p className="section-label mb-1">Trip planning</p>
          <h1 className="page-title">Plan a Trip</h1>
          <p className="page-subtitle">Build your plan, save it to history.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => onNavigate('results')} className="btn btn-ghost btn-sm">
            ← Back to Results
          </button>
          {selectedSite?.bookingUrl && (
            <a href={selectedSite.bookingUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              Open Booking →
            </a>
          )}
        </div>
      </div>

      {selectedSite && (
        <div className="mb-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-sm text-[var(--muted)]">
          <span className="mr-2 font-medium text-[var(--text)]">{selectedSite.campgroundName || selectedSite.recAreaName}</span>
          <span>{selectedSite.provider}</span>
          {selectedSite.checkIn && (
            <span className="ml-2">{selectedSite.checkIn} → {selectedSite.checkOut}</span>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="content-card space-y-5">
          <div>
            <p className="section-label mb-3">Trip details</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="trip-name">Trip name</label>
                <input id="trip-name" value={trip.name} onChange={event => setTrip(current => ({ ...current, name: event.target.value }))} />
              </div>
              <div>
                <label className="field-label" htmlFor="destination">Destination</label>
                <input id="destination" value={destination} onChange={event => setDestination(event.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="arrive-date">Arrive</label>
                <input id="arrive-date" type="date" value={trip.startDate} onChange={event => setTrip(current => ({ ...current, startDate: event.target.value }))} />
              </div>
              <div>
                <label className="field-label" htmlFor="depart-date">Depart</label>
                <input id="depart-date" type="date" value={trip.endDate} onChange={event => setTrip(current => ({ ...current, endDate: event.target.value }))} />
              </div>
              <div>
                <label className="field-label" htmlFor="trip-nights">Nights</label>
                <input
                  id="trip-nights"
                  type="number"
                  min={1}
                  value={trip.nights}
                  onChange={event => setTrip(current => ({ ...current, nights: Number(event.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="trip-status">Status</label>
                <select id="trip-status" value={trip.status} onChange={event => setTrip(current => ({ ...current, status: event.target.value as TripPlan['status'] }))}>
                  <option value="Planned">Planned</option>
                  <option value="Booked">Booked</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="field-label" htmlFor="trip-notes">Notes</label>
              <textarea id="trip-notes" value={trip.notes ?? ''} onChange={event => setTrip(current => ({ ...current, notes: event.target.value }))} />
            </div>
          </div>

          {error && <div className="flash-error">{error}</div>}
          <div className="form-actions">
            <button type="button" disabled={saving} onClick={() => void saveTrip()} className="btn btn-primary btn-md w-full">
              {saving ? 'Saving…' : 'Save Trip Plan'}
            </button>
          </div>
        </div>

        <div className="content-card">
          <p className="section-label mb-1">Pre-trip checklist</p>
          <p className="mb-4 text-xs text-[var(--muted)]">Customize your wilderness prep list.</p>
          <ChecklistBuilder items={checklist} onChange={setChecklist} />
        </div>
      </div>
    </PageShell>
  );
}
