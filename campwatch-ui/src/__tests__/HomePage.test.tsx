import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HomePage from '../pages/HomePage';
import { SEARCH_INTENT_KEY } from '../utils/storage';
import { mockJsonResponse } from './testUtils';

describe('HomePage', () => {
  it('renders the hero title and validates required fields', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();

    render(<HomePage onNavigate={navigate} />);

    expect(screen.getByRole('heading', { name: /moondock/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ohio state parks/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /find campsites/i }));
    expect(screen.getByText(/choose a provider before searching/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('stores a search intent and navigates to results', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({
      items: [{ id: '458', name: 'Hocking Hills State Park' }],
      provider: 'OhioStateParks',
    }));

    render(<HomePage onNavigate={navigate} />);

    await user.click(screen.getByRole('button', { name: /ohio state parks/i }));
    await user.click(await screen.findByRole('button', { name: /browse 1 options/i }));
    await user.click(screen.getByRole('button', { name: /hocking hills state park/i }));
    await user.type(screen.getByLabelText(/arrive/i), '2026-07-10');
    await user.type(screen.getByLabelText(/depart/i), '2026-07-12');
    await user.click(screen.getByRole('button', { name: /find campsites/i }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('results'));
    expect(JSON.parse(window.localStorage.getItem(SEARCH_INTENT_KEY) ?? '{}')).toMatchObject({
      provider: 'OhioStateParks',
      campgroundIds: ['458'],
    });
  });
});
