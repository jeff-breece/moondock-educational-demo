import type { RoutePage } from '../hooks/useRoute';

const NAV_ITEMS: { id: RoutePage; label: string; icon: string }[] = [
  { id: 'home',    label: 'Search',      icon: 'mif-search'    },
  { id: 'results', label: 'Results',     icon: 'mif-tree'      },
  { id: 'history', label: 'Trip History',icon: 'mif-clipboard' },
  { id: 'reserve', label: 'Plan a Trip', icon: 'mif-flag'      },
  { id: 'log',     label: 'Trip Log',    icon: 'mif-bookmark'  },
];

interface HamburgerNavProps {
  open: boolean;
  currentPage: RoutePage;
  onNavigate: (page: RoutePage) => void;
  onClose: () => void;
}

export default function HamburgerNav({ open, currentPage, onNavigate, onClose }: HamburgerNavProps) {
  const handleNavigate = (page: RoutePage) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="nav-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`nav-drawer${open ? ' open' : ''}`}
        aria-label="Site navigation"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="section-label">Wilderness camping</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text)]">Moondock</h2>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          >
            <span className="mif-cross" aria-hidden="true" />
          </button>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`nav-item${currentPage === item.id ? ' active' : ''}`}
            >
              <span className={`${item.icon} text-lg`} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
