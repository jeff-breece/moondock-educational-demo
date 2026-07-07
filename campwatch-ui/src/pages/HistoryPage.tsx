import { useEffect, useMemo, useState } from 'react';
import PageShell from '../components/PageShell';
import Spinner from '../components/Spinner';
import TripCard from '../components/TripCard';
import type { RoutePage } from '../hooks/useRoute';
import type { OutingLogEntry, OutingNotes, TripPlan } from '../types/camping';
import { apiUrl } from '../utils/api';
import {
  FLASH_KEY,
  LOG_CONTEXT_KEY,
  SELECTED_SITE_KEY,
  TRIP_DRAFT_KEY,
  clearStored,
  readStored,
  writeStored,
} from '../utils/storage';

interface HistoryPageProps {
  onNavigate: (page: RoutePage) => void;
}

interface HistoryItem {
  key: string;
  title: string;
  destination: string;
  dates: string;
  status: string;
  sortDate: string;
  source: 'trip' | 'outing';
  trip?: TripPlan;
  outing?: OutingLogEntry;
  notes?: OutingNotes;
}

function parseOutingNotes(value?: string) {
  if (!value) return {} satisfies OutingNotes;
  try {
    return JSON.parse(value) as OutingNotes;
  } catch {
    return {} satisfies OutingNotes;
  }
}

export default function HistoryPage({ onNavigate }: HistoryPageProps) {
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [outings, setOutings] = useState<OutingLogEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Planned' | 'Booked' | 'Completed'>('All');
  const [flash, setFlash] = useState(() => readStored<string>(FLASH_KEY, ''));
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (flash) clearStored(FLASH_KEY);
  }, [flash]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [tripResponse, outingResponse] = await Promise.all([
          fetch(apiUrl('/api/trips')),
          fetch(apiUrl('/api/outings')),
        ]);
        const tripData = tripResponse.ok ? await tripResponse.json() as TripPlan[] : [];
        const outingData = outingResponse.ok ? await outingResponse.json() as OutingLogEntry[] : [];
        if (!cancelled) {
          setTrips(tripData);
          setOutings(outingData);
        }
      } catch {
        if (!cancelled) setFetchError('Could not load trip history. Check your connection and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const historyItems = useMemo<HistoryItem[]>(() => {
    const tripItems = trips.map(trip => ({
      key: `trip-${trip.id ?? trip.name}`,
      title: trip.name,
      destination: trip.campgroundName || trip.recAreaName || 'Unknown destination',
      dates: `${trip.startDate} → ${trip.endDate}`,
      status: trip.status,
      sortDate: trip.updatedAt ?? trip.createdAt ?? trip.startDate,
      source: 'trip' as const,
      trip,
    }));

    const outingItems = outings.map(outing => {
      const notes = parseOutingNotes(outing.notes);
      return {
        key: `outing-${outing.id ?? outing.date}`,
        title: notes.title ?? outing.location,
        destination: outing.location,
        dates: `${outing.date} · ${outing.durationDays} day${outing.durationDays === 1 ? '' : 's'}`,
        status: 'Completed',
        sortDate: outing.recordedAt ?? outing.date,
        source: 'outing' as const,
        outing,
        notes,
      };
    });

    return [...tripItems, ...outingItems].sort((left, right) => right.sortDate.localeCompare(left.sortDate));
  }, [outings, trips]);

  const visibleItems = historyItems.filter(item => statusFilter === 'All' || item.status === statusFilter);

  const openLog = (item: HistoryItem) => {
    if (item.source === 'trip' && item.trip) {
      writeStored(LOG_CONTEXT_KEY, {
        date: item.trip.startDate,
        location: item.trip.campgroundName || item.trip.recAreaName,
        title: item.trip.name,
        durationDays: item.trip.nights,
      });
    }

    if (item.source === 'outing' && item.outing) {
      writeStored(LOG_CONTEXT_KEY, {
        date: item.outing.date,
        location: item.outing.location,
        durationDays: item.outing.durationDays,
        ...item.notes,
      });
    }

    onNavigate('log');
  };

  const editItem = (item: HistoryItem) => {
    if (item.source === 'trip' && item.trip) {
      writeStored(TRIP_DRAFT_KEY, item.trip);
      clearStored(SELECTED_SITE_KEY);
      onNavigate('reserve');
      return;
    }

    openLog(item);
  };

  const flashClassName = flash.toLowerCase().includes('could not') || flash.toLowerCase().includes('error')
    ? 'flash-error'
    : 'flash-success';

  return (
    <PageShell width="medium" align="top">
      <div className="relative mb-6 text-center">
        <p className="section-label mb-1">Trip history</p>
        <h1 className="page-title">My Trips</h1>
        <button
          type="button"
          onClick={() => {
            clearStored(TRIP_DRAFT_KEY);
            onNavigate('reserve');
          }}
          className="btn btn-primary btn-sm absolute right-0 top-1/2 -translate-y-1/2"
        >
          + New Trip
        </button>
      </div>

      {flash && (
        <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 ${flashClassName}`}>
          <span>{flash}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFlash('')}>Dismiss</button>
        </div>
      )}

      {fetchError && <div className="flash-error mb-6">{fetchError}</div>}

      <div className="mb-6 flex flex-wrap gap-2">
        {(['All', 'Planned', 'Booked', 'Completed'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`tab-chip${statusFilter === tab ? ' active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading && (
          <div role="status" className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && !fetchError && visibleItems.length === 0 && (
          <div className="empty-state">
            <p className="mb-4">No trips yet — plan your first adventure.</p>
            <button
              type="button"
              onClick={() => { clearStored(TRIP_DRAFT_KEY); onNavigate('reserve'); }}
              className="btn btn-primary btn-md"
            >
              Plan your first trip
            </button>
          </div>
        )}

        {visibleItems.map(item => (
          <TripCard
            key={item.key}
            title={item.title}
            destination={item.destination}
            dates={item.dates}
            status={item.status}
            kind={item.source}
            logLabel={item.source === 'outing' ? 'View Log' : 'Write Log'}
            onViewLog={() => openLog(item)}
            onEdit={() => editItem(item)}
            editLabel={item.source === 'trip' ? 'Edit' : 'Add Note'}
          />
        ))}
      </div>
    </PageShell>
  );
}
