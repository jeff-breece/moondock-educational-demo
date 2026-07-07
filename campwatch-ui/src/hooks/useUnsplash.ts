import { useEffect, useState } from 'react';

const HERO_CACHE_KEY = 'campwatch_hero_image';
const HERO_TTL_MS = 21_600_000;
const HERO_FALLBACK = 'linear-gradient(135deg, #0d2a15 0%, #1a3a20 50%, #0d1a11 100%)';

interface CachedHeroImage {
  url: string;
  credit: string;
  creditLink: string;
  cachedAt: number;
}

interface UnsplashState {
  url: string;
  credit: string;
  creditLink: string;
  loading: boolean;
}

function readCache() {
  try {
    const raw = window.localStorage.getItem(HERO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedHeroImage;
    if (!parsed.url || !parsed.cachedAt) return null;
    if (Date.now() - parsed.cachedAt > HERO_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useUnsplash() {
  const [state, setState] = useState<UnsplashState>({
    url: HERO_FALLBACK,
    credit: '',
    creditLink: '',
    loading: true,
  });

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setState({
        url: cached.url,
        credit: cached.credit,
        creditLink: cached.creditLink,
        loading: false,
      });
      return;
    }

    const accessKey = import.meta.env.VITE_UNSPLASH_KEY;
    if (!accessKey) {
      setState({ url: HERO_FALLBACK, credit: '', creditLink: '', loading: false });
      return;
    }

    const query = import.meta.env.VITE_HERO_QUERY ?? 'primitive tent camping forest wilderness';
    const controller = new AbortController();

    void fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${encodeURIComponent(accessKey)}`,
      { signal: controller.signal },
    )
      .then(async response => {
        if (!response.ok) throw new Error('Unsplash request failed');
        const data = await response.json() as {
          urls?: { regular?: string; full?: string; small?: string };
          user?: { name?: string; links?: { html?: string } };
          links?: { html?: string };
        };
        const payload: CachedHeroImage = {
          url: data.urls?.regular ?? data.urls?.full ?? data.urls?.small ?? HERO_FALLBACK,
          credit: data.user?.name ? `Photo by ${data.user.name} on Unsplash` : 'Photo on Unsplash',
          creditLink: data.user?.links?.html ?? data.links?.html ?? 'https://unsplash.com',
          cachedAt: Date.now(),
        };
        window.localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(payload));
        setState({
          url: payload.url,
          credit: payload.credit,
          creditLink: payload.creditLink,
          loading: false,
        });
      })
      .catch(() => {
        setState({ url: HERO_FALLBACK, credit: '', creditLink: '', loading: false });
      });

    return () => controller.abort();
  }, []);

  return state;
}
