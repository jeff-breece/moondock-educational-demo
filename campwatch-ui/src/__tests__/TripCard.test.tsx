import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TripCard from '../components/TripCard';

describe('TripCard', () => {
  it('renders actions for a trip', async () => {
    const user = userEvent.setup();
    const onViewLog = vi.fn();
    const onEdit = vi.fn();

    render(
      <TripCard
        title="Hocking Hills getaway"
        destination="Hocking Hills State Park"
        dates="2026-07-10 → 2026-07-12"
        status="Planned"
        onViewLog={onViewLog}
        onEdit={onEdit}
      />,
    );

    await user.click(screen.getByRole('button', { name: /view log/i }));
    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(onViewLog).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalled();
  });
});
