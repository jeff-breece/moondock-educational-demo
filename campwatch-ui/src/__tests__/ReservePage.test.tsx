import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReservePage from '../pages/ReservePage';
import { SELECTED_SITE_KEY } from '../utils/storage';
import { mockJsonResponse } from './testUtils';

describe('ReservePage', () => {
  it('renders trip planning fields and saves a trip plan', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();

    window.localStorage.setItem(SELECTED_SITE_KEY, JSON.stringify({
      id: 1,
      campgroundName: 'Hocking Hills State Park',
      provider: 'OhioStateParks',
      siteId: 'A-12',
      siteType: 'TENT_ONLY',
      isReservable: true,
      checkIn: '2026-07-10',
      checkOut: '2026-07-12',
      bookingUrl: 'https://example.com',
      matchScore: 90,
      status: 'New',
      receivedAt: '2026-07-03T00:00:00Z',
      nights: 2,
    }));

    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({ id: 99 }));

    render(<ReservePage onNavigate={navigate} />);

    expect(screen.getByDisplayValue(/hocking hills state park getaway/i)).toBeInTheDocument();
    expect(screen.getByText(/reserve campsite online/i)).toBeInTheDocument();

    await user.clear(screen.getByDisplayValue(/hocking hills state park getaway/i));
    await user.type(screen.getByLabelText(/trip name/i), 'July escape');
    await user.click(screen.getByRole('button', { name: /save trip plan/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/trips'), expect.objectContaining({ method: 'POST' })));
    expect(navigate).toHaveBeenCalledWith('history');
  });
});
