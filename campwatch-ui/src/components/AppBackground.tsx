import { useUnsplash } from '../hooks/useUnsplash';

/**
 * App-wide fixed background. Renders the cached hero image (or gradient
 * fallback) behind every page so the whole app shares the home screen's
 * look. A strong dark overlay keeps page text and cards readable.
 */
export default function AppBackground() {
  const hero = useUnsplash();
  const isGradient = hero.url.startsWith('linear-gradient');

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: isGradient ? hero.url : `url(${hero.url})` }}
      />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,rgba(9,16,11,0.82),rgba(13,26,17,0.9),rgba(9,16,11,0.96))]" />

      {hero.credit && !hero.loading && (
        <a
          href={hero.creditLink}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-3 right-3 z-40 rounded-full bg-black/40 px-3 py-1 text-xs text-[var(--text)] no-underline backdrop-blur hover:text-[var(--accent)]"
        >
          {hero.credit}
        </a>
      )}
    </>
  );
}
