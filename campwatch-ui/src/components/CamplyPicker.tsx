import { useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../utils/api';

export interface CamplyPickerItem {
  id: string;
  name: string;
}

export interface CamplyPickerProps {
  provider: string;
  searchType: 'campgrounds' | 'recreation-areas';
  value: string[];
  onChange: (ids: string[]) => void;
  label: string;
  placeholder?: string;
  hint?: string;
  singleSelect?: boolean;
  initQuery?: string;
  minQueryLength?: number;
  disabled?: boolean;
}

const DEBOUNCE_MS = 350;

export function CamplyPicker({
  provider,
  searchType,
  value,
  onChange,
  label,
  placeholder,
  hint,
  singleSelect = false,
  initQuery,
  minQueryLength = 2,
  disabled = false,
}: CamplyPickerProps) {
  const [seedItems, setSeedItems] = useState<CamplyPickerItem[]>([]);
  const [liveItems, setLiveItems] = useState<CamplyPickerItem[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!provider || initQuery === undefined || disabled) {
      setSeedItems([]);
      setSeedLoading(false);
      return;
    }

    setSeedLoading(true);
    setFetchErr('');

    void fetch(
      apiUrl(`/api/camply/search/${searchType}?provider=${encodeURIComponent(provider)}&q=${encodeURIComponent(initQuery)}`),
    )
      .then(async response => {
        if (!response.ok) throw new Error('Could not load options');
        const data = await response.json() as { items?: CamplyPickerItem[] };
        setSeedItems(data.items ?? []);
      })
      .catch(() => setFetchErr('Could not load options'))
      .finally(() => setSeedLoading(false));
  }, [disabled, initQuery, provider, searchType]);

  useEffect(() => {
    if (disabled || !provider || query.length < minQueryLength) {
      setLiveItems([]);
      setLiveLoading(false);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLiveLoading(true);
      setFetchErr('');

      void fetch(
        apiUrl(`/api/camply/search/${searchType}?provider=${encodeURIComponent(provider)}&q=${encodeURIComponent(query)}`),
        { signal: controller.signal },
      )
        .then(async response => {
          if (!response.ok) throw new Error('Search failed');
          const data = await response.json() as { items?: CamplyPickerItem[] };
          setLiveItems(data.items ?? []);
        })
        .catch(error => {
          if ((error as Error).name !== 'AbortError') setFetchErr('Search failed');
        })
        .finally(() => setLiveLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [disabled, minQueryLength, provider, query, searchType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleItems = query.length >= minQueryLength ? liveItems : seedItems;
  const loading = query.length >= minQueryLength ? liveLoading : seedLoading;

  const namesMap = useMemo(
    () => new Map([...seedItems, ...liveItems].map(item => [item.id, item.name])),
    [liveItems, seedItems],
  );

  const toggle = (id: string) => {
    if (singleSelect) {
      onChange(value[0] === id ? [] : [id]);
    } else {
      onChange(value.includes(id) ? value.filter(entry => entry !== id) : [...value, id]);
    }
    setQuery('');
    setOpen(singleSelect ? false : true);
  };

  // Either/or entry points (issue #206): the "Browse N options" button is the
  // sole affordance when seed options are loaded and nothing is selected yet.
  // The filter input replaces it once the list is open, a value is chosen, or
  // there are no seed options (search-only mode). When disabled we still render
  // the (disabled) input so the "select a provider first" hint is visible.
  const showBrowse = !disabled && !open && seedItems.length > 0 && value.length === 0;
  const showInput = disabled || open || value.length > 0 || seedItems.length === 0;
  const showSeedLoading = !disabled && seedLoading && seedItems.length === 0 && query.length < minQueryLength;

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(id => (
            <span
              key={id}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[rgba(200,164,94,0.12)] px-3 py-1 text-xs text-[var(--accent)]"
            >
              {namesMap.get(id) ?? id}
              <button type="button" onClick={() => onChange(value.filter(entry => entry !== id))}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {showSeedLoading && (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted)]">
          <span className="animate-spin">⟳</span> Loading options…
        </div>
      )}

      {showBrowse && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface2)] px-3 py-2 text-left text-sm text-[var(--text)] hover:border-[var(--primary)]"
        >
          Browse {seedItems.length} options
        </button>
      )}

      {showInput && (
        <div className="relative">
          <input
            type="text"
            value={query}
            disabled={disabled}
            onChange={event => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => !disabled && setOpen(true)}
            placeholder={disabled
              ? 'Select a provider first'
              : placeholder ?? (seedItems.length > 0 ? 'Filter options or type to search' : `Type ${minQueryLength}+ characters to search`)}
            autoComplete="off"
            className="pr-10"
          />
          {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">⟳</span>}
        </div>
      )}

      {fetchErr && <p className="text-xs text-[var(--error)]">{fetchErr}</p>}
      {hint && <p className="text-xs text-[var(--muted)]">{hint}</p>}

      {open && !disabled && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface2)] shadow-lg">
          {loading && visibleItems.length === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--muted)]">Searching…</div>
          )}

          {!loading && visibleItems.length === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--muted)]">
              {query.length >= minQueryLength ? `No results for “${query}”` : 'No options yet — try typing a search.'}
            </div>
          )}

          {visibleItems.slice(0, 30).map(item => {
            const selected = value.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                  selected
                    ? 'bg-[rgba(90,138,60,0.2)] text-[var(--text)]'
                    : 'text-[var(--text)] hover:bg-[rgba(90,138,60,0.12)]'
                }`}
              >
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-xs text-[var(--muted)]">{item.id}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
