import type { RoutePage } from '../hooks/useRoute';

const PAGE_LABELS: Record<RoutePage, string> = {
  home: '',
  results: 'Search Results',
  reserve: 'Plan a Trip',
  history: 'Trip History',
  log: 'Trip Log',
};

interface TopBarProps {
  currentPage: RoutePage;
  onMenuClick: () => void;
}

export default function TopBar({ currentPage, onMenuClick }: TopBarProps) {
  const pageLabel = PAGE_LABELS[currentPage];

  return (
    <header className="topbar">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] text-xl text-[var(--text)] hover:bg-[var(--surface2)]"
      >
        <span className="mif-menu" aria-hidden="true" />
      </button>
      <span className="topbar-brand">Moondock</span>
      {pageLabel && (
        <>
          <span className="text-[var(--border)] text-lg font-thin">/</span>
          <span className="topbar-page">{pageLabel}</span>
        </>
      )}
    </header>
  );
}
