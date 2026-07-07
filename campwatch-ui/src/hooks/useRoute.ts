import { useCallback, useEffect, useState } from 'react';

export type RoutePage = 'home' | 'results' | 'reserve' | 'history' | 'log';

const DEFAULT_PAGE: RoutePage = 'home';
const VALID_PAGES = new Set<RoutePage>(['home', 'results', 'reserve', 'history', 'log']);

function normalizeHash(hash: string): RoutePage {
  const cleaned = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (VALID_PAGES.has(cleaned as RoutePage)) {
    return cleaned as RoutePage;
  }
  return DEFAULT_PAGE;
}

function routeHash(page: RoutePage) {
  return `#/${page}`;
}

export function useRoute() {
  const [page, setPage] = useState<RoutePage>(() => normalizeHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setPage(normalizeHash(window.location.hash));

    if (!window.location.hash) {
      window.history.replaceState(null, '', routeHash(DEFAULT_PAGE));
    }

    window.addEventListener('hashchange', onHashChange);
    onHashChange();

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((nextPage: RoutePage) => {
    window.location.hash = routeHash(nextPage);
  }, []);

  return { page, navigate };
}
