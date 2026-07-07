import { useState, type ReactElement } from 'react';
import AppBackground from './components/AppBackground';
import HamburgerNav from './components/HamburgerNav';
import TopBar from './components/TopBar';
import { type RoutePage, useRoute } from './hooks/useRoute';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import LogPage from './pages/LogPage';
import ReservePage from './pages/ReservePage';
import ResultsPage from './pages/ResultsPage';
import './index.css';

export default function App() {
  const { page, navigate } = useRoute();
  const [navOpen, setNavOpen] = useState(false);

  const pages: Record<RoutePage, ReactElement> = {
    home: <HomePage onNavigate={navigate} />,
    results: <ResultsPage onNavigate={navigate} />,
    reserve: <ReservePage onNavigate={navigate} />,
    history: <HistoryPage onNavigate={navigate} />,
    log: <LogPage onNavigate={navigate} />,
  };

  return (
    <div className="min-h-screen w-full text-[var(--text)]">
      <AppBackground />
      <TopBar currentPage={page} onMenuClick={() => setNavOpen(true)} />
      <HamburgerNav
        open={navOpen}
        currentPage={page}
        onNavigate={navigate}
        onClose={() => setNavOpen(false)}
      />
      <main className="w-full">{pages[page]}</main>
    </div>
  );
}
