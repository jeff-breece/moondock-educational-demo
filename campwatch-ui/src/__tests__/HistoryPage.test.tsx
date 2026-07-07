import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HistoryPage from '../pages/HistoryPage';
import { mockJsonResponse } from './testUtils';

describe('HistoryPage', () => {
  it('renders the empty state and filter tabs', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockJsonResponse([]))
      .mockResolvedValueOnce(mockJsonResponse([]));

    render(<HistoryPage onNavigate={vi.fn()} />);

    await waitFor(() => expect(screen.getByText(/no trips yet/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Planned' })).toBeInTheDocument();
  });

  it('renders trips and filters completed history', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockJsonResponse([{
        id: 1,
        name: 'Hocking Hills getaway',
        provider: 'OhioStateParks',
        campgroundId: '458',
        campgroundName: 'Hocking Hills State Park',
        recAreaId: '',
        recAreaName: '',
        startDate: '2026-07-10',
        endDate: '2026-07-12',
        nights: 2,
        status: 'Planned',
        notes: '',
        checklistJson: '[]',
        createdAt: '2026-07-01T00:00:00Z',
        updatedAt: '2026-07-01T00:00:00Z',
      }]))
      .mockResolvedValueOnce(mockJsonResponse([{
        id: 9,
        date: '2026-06-20',
        location: 'Wayne National Forest',
        durationDays: 3,
        notes: JSON.stringify({ title: 'Forest weekend', journal: 'Great trip' }),
        recordedAt: '2026-06-21T00:00:00Z',
      }]));

    render(<HistoryPage onNavigate={vi.fn()} />);

    expect(await screen.findByText(/hocking hills getaway/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.getByText(/forest weekend/i)).toBeInTheDocument();
  });
});
