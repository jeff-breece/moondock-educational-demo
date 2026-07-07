import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ResultsPage from '../pages/ResultsPage';
import { SEARCH_INTENT_KEY, SELECTED_SITE_KEY } from '../utils/storage';
import { mockJsonResponse } from './testUtils';

function seedIntent() {
  window.localStorage.setItem(SEARCH_INTENT_KEY, JSON.stringify({
    provider: 'OhioStateParks',
    destinationMode: 'campground',
    campgroundIds: ['458'],
    recreationAreaIds: [],
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    nights: 2,
    equipment: ['Tent'],
  }));
}

describe('ResultsPage', () => {
  it('shows a loading state and then an empty state', async () => {
    seedIntent();
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockJsonResponse({ jobId: 'job-1', status: 'running' }))
      .mockResolvedValueOnce(mockJsonResponse({ jobs: [{ id: 'job-1', status: 'completed' }] }))
      .mockResolvedValueOnce(mockJsonResponse({ items: [] }));

    render(<ResultsPage onNavigate={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent(/starting campsite search/i);
    await waitFor(() => expect(screen.getByText(/no open campsites right now/i)).toBeInTheDocument());
  });

  it('renders site cards and stores the selected site for planning', async () => {
    seedIntent();
    const user = userEvent.setup();
    const navigate = vi.fn();

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockJsonResponse({ jobId: 'job-2', status: 'running' }))
      .mockResolvedValueOnce(mockJsonResponse({ jobs: [{ id: 'job-2', status: 'completed' }] }))
      .mockResolvedValueOnce(mockJsonResponse({
        items: [{
          id: 7,
          campgroundName: 'Hocking Hills State Park',
          provider: 'OhioStateParks',
          siteId: 'A-12',
          siteType: 'TENT_ONLY',
          isReservable: true,
          checkIn: '2026-07-10',
          checkOut: '2026-07-12',
          bookingUrl: 'https://example.com',
          matchScore: 88,
          status: 'New',
          receivedAt: '2026-07-03T00:00:00Z',
        }],
      }));

    render(<ResultsPage onNavigate={navigate} />);

    expect(await screen.findByText(/hocking hills state park/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /plan this trip/i }));

    expect(navigate).toHaveBeenCalledWith('reserve');
    expect(JSON.parse(window.localStorage.getItem(SELECTED_SITE_KEY) ?? '{}')).toMatchObject({
      campgroundName: 'Hocking Hills State Park',
      id: 7,
    });
  });
});
