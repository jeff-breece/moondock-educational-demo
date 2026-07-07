import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import Spinner from '../components/Spinner';
import type { RoutePage } from '../hooks/useRoute';
import type { OutingLogEntry, OutingNotes } from '../types/camping';
import { apiUrl } from '../utils/api';
import { LOG_CONTEXT_KEY, readStored } from '../utils/storage';

interface LogPageProps {
  onNavigate: (page: RoutePage) => void;
}

function parseOutingNotes(value?: string) {
  if (!value) return {} satisfies OutingNotes;
  try {
    return JSON.parse(value) as OutingNotes;
  } catch {
    return {} satisfies OutingNotes;
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function LogPage({ onNavigate }: LogPageProps) {
  const context = readStored<Record<string, unknown> | null>(LOG_CONTEXT_KEY, null);
  const hasContext = Boolean(context);

  const [date, setDate] = useState(String(context?.date ?? todayIso()));
  const [location, setLocation] = useState(String(context?.location ?? ''));
  const [title, setTitle] = useState(String(context?.title ?? ''));
  const [durationDays, setDurationDays] = useState(Number(context?.durationDays ?? 1));
  const [journal, setJournal] = useState(String(context?.journal ?? ''));
  const [hikes, setHikes] = useState(String(context?.hikes ?? ''));
  const [meals, setMeals] = useState(String(context?.meals ?? ''));
  const [siteNotes, setSiteNotes] = useState(String(context?.siteNotes ?? ''));
  const [photos, setPhotos] = useState<string[]>(Array.isArray(context?.photos) ? context.photos.filter(item => typeof item === 'string') as string[] : []);
  const [uploadError, setUploadError] = useState('');
  const [recentEntries, setRecentEntries] = useState<OutingLogEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState('');
  const [message, setMessage] = useState('');

  const loadEntries = async () => {
    setEntriesLoading(true);
    setEntriesError('');
    try {
      const response = await fetch(apiUrl('/api/outings'));
      if (!response.ok) throw new Error('Could not load entries.');
      const data = await response.json() as OutingLogEntry[];
      setRecentEntries(data);
    } catch {
      setEntriesError('Could not load recent entries.');
    } finally {
      setEntriesLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadError('');
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(apiUrl('/api/photos'), { method: 'POST', body: form });
      if (!response.ok) {
        let detail = '';
        try {
          const body = await response.json() as { error?: string };
          detail = body.error ?? '';
        } catch {
          detail = '';
        }
        setUploadError(`Upload failed for ${file.name}${detail ? `: ${detail}` : ` (HTTP ${response.status})`}`);
        continue;
      }
      const data = await response.json() as { url: string };
      setPhotos(current => [...current, data.url]);
    }
    event.target.value = '';
  };

  const saveEntry = async () => {
    if (!date || !location) {
      setMessage('Date and location are required.');
      return;
    }

    const notes: OutingNotes = {
      title,
      journal,
      hikes,
      meals,
      siteNotes,
      photos,
    };

    const response = await fetch(apiUrl('/api/outings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        location,
        durationDays,
        notes: JSON.stringify(notes),
      }),
    });

    if (!response.ok) {
      setMessage('Could not save log entry.');
      return;
    }

    setMessage('Log entry saved.');
    setTitle('');
    setJournal('');
    setHikes('');
    setMeals('');
    setSiteNotes('');
    setPhotos([]);
    await loadEntries();
  };

  return (
    <PageShell width="medium">
      <button
        type="button"
        onClick={() => onNavigate('history')}
        className="btn btn-ghost btn-sm mb-4"
      >
        ← History
      </button>

      <div className="mb-6 text-center">
        <p className="section-label mb-1">Field journal</p>
        <h1 className="page-title">Trip Log</h1>
      </div>

      <div className="content-card mb-6">
        {message && (
          <div className={`mb-5 ${message.includes('saved') ? 'flash-success' : 'flash-error'}`}>
            {message}
          </div>
        )}

        {!hasContext && (
          <div className="mb-5 rounded-[var(--radius)] border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
            New journal entry — fill in the details below.
          </div>
        )}
        <div className="form-section">
          <p className="section-label mb-3">Trip info</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="trip-date">Trip date</label>
              <input id="trip-date" type="date" value={date} onChange={event => setDate(event.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="location">Location</label>
              <input id="location" value={location} onChange={event => setLocation(event.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="log-title">Title / headline</label>
              <input id="log-title" value={title} onChange={event => setTitle(event.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="duration-days">Duration (days)</label>
              <input id="duration-days" type="number" min={1} value={durationDays} onChange={event => setDurationDays(Number(event.target.value) || 1)} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <p className="section-label mb-3">Journal</p>
          <label className="field-label" htmlFor="journal">Journal</label>
          <textarea id="journal" value={journal} onChange={event => setJournal(event.target.value)} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="hikes">Hikes</label>
              <textarea id="hikes" value={hikes} onChange={event => setHikes(event.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="meals">Meals</label>
              <textarea id="meals" value={meals} onChange={event => setMeals(event.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <label className="field-label" htmlFor="site-notes">Site notes</label>
            <textarea id="site-notes" value={siteNotes} onChange={event => setSiteNotes(event.target.value)} />
          </div>
        </div>

        <div>
          <p className="section-label mb-3">Photos</p>
          <label className="btn btn-secondary btn-sm inline-block cursor-pointer" htmlFor="photo-upload">
            📷 Add photos
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={event => void handlePhotoUpload(event)}
          />
          {uploadError && <p className="mt-2 text-sm text-[var(--error)]">{uploadError}</p>}
          {photos.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              {photos.map(photo => (
                <li key={photo} className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2">
                  <img src={apiUrl(photo)} alt="trip photo" className="h-12 w-12 rounded object-cover" />
                  <span className="truncate flex-1 text-xs">{photo.split('/').pop()}</span>
                  <button type="button" onClick={() => setPhotos(current => current.filter(item => item !== photo))} className="btn btn-danger btn-sm">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => void saveEntry()} className="btn btn-primary btn-md w-full">
            Save Log Entry
          </button>
        </div>
      </div>

      <div className="content-card">
        <h2 className="mb-4 text-lg font-semibold">Recent Entries</h2>
        {entriesLoading && (
          <div role="status" className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {entriesError && <div className="flash-error">{entriesError}</div>}
        {!entriesLoading && !entriesError && (
          <div className="space-y-4">
            {recentEntries.length === 0 && <p className="text-sm text-[var(--muted)]">No journal entries yet.</p>}
            {recentEntries.map(entry => {
              const notes = parseOutingNotes(entry.notes);
              return (
                <article key={entry.id ?? `${entry.date}-${entry.location}`} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface2)] p-4">
                  <h3 className="text-lg font-semibold">{notes.title ?? entry.location}</h3>
                  <p className="text-sm text-[var(--muted)]">{entry.date} · {entry.durationDays} day{entry.durationDays === 1 ? '' : 's'}</p>
                  {notes.journal && <p className="mt-2 text-sm text-[var(--text)]">{notes.journal}</p>}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
