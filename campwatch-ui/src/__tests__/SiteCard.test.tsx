import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SiteCard from '../components/SiteCard';

const BASE_RESULT = {
  id: 1,
  campgroundName: 'Hocking Hills',
  provider: 'OhioStateParks',
  siteId: 'A-12',
  siteType: 'WALK_IN',
  isReservable: true,
  checkIn: '2026-07-10',
  checkOut: '2026-07-12',
  bookingUrl: 'https://example.com',
  matchScore: 87,
  status: 'New' as const,
  receivedAt: '2026-07-01T00:00:00Z',
};

describe('SiteCard', () => {
  it('renders campsite details and plans a trip', async () => {
    const user = userEvent.setup();
    const onPlan = vi.fn();

    render(<SiteCard result={BASE_RESULT} onPlan={onPlan} />);

    expect(screen.getByText('Hocking Hills')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /plan this trip/i }));
    expect(onPlan).toHaveBeenCalledWith(BASE_RESULT);
  });

  it('separates provider facts from estimated/inferred signals (#205)', () => {
    render(<SiteCard result={BASE_RESULT} onPlan={vi.fn()} />);

    // Facts zone is clearly labelled as coming from the provider
    expect(screen.getByText(/facts · from provider/i)).toBeInTheDocument();
    // Derived signals are clearly labelled as estimates to verify
    expect(screen.getByText(/estimated signals · inferred, verify with park/i)).toBeInTheDocument();
    expect(screen.getByText(/primitive fit/i)).toBeInTheDocument();
    expect(screen.getByText(/seclusion/i)).toBeInTheDocument();
    expect(screen.getByText(/forest bathing/i)).toBeInTheDocument();
  });

  it('shows match score and a booking link when present (#205)', () => {
    render(<SiteCard result={BASE_RESULT} onPlan={vi.fn()} />);
    expect(screen.getByText(/match 87/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /view booking page/i });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders Unknown for missing site fields instead of hiding them (#205)', () => {
    render(
      <SiteCard
        result={{ ...BASE_RESULT, siteId: '', siteType: '' }}
        onPlan={vi.fn()}
      />,
    );
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === 'P' && element.textContent === 'Site Unknown · Unknown type',
      ),
    ).toBeInTheDocument();
  });
});
