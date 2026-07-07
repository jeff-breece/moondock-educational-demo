import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LogPage from '../pages/LogPage';
import { mockJsonResponse } from './testUtils';

describe('LogPage', () => {
  it('renders the journal form and saves an entry', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockJsonResponse([]))
      .mockResolvedValueOnce(mockJsonResponse({ id: 1 }))
      .mockResolvedValueOnce(mockJsonResponse([{
        id: 1,
        date: '2026-07-10',
        location: 'Hocking Hills State Park',
        durationDays: 2,
        notes: JSON.stringify({ title: 'Campfire night', journal: 'Warm evening at the site.' }),
      }]));

    render(<LogPage onNavigate={vi.fn()} />);

    await user.clear(screen.getByLabelText(/trip date/i));
    await user.type(screen.getByLabelText(/trip date/i), '2026-07-10');
    await user.type(screen.getByLabelText(/location/i), 'Hocking Hills State Park');
    await user.type(screen.getByLabelText(/title \/ headline/i), 'Campfire night');
    await user.type(screen.getByLabelText(/^journal$/i), 'Warm evening at the site.');
    // Photo upload is now a file input — skip file system interaction in unit test
    await user.click(screen.getByRole('button', { name: /save log entry/i }));

    await waitFor(() => expect(screen.getByText(/log entry saved/i)).toBeInTheDocument());
    expect(await screen.findByText(/campfire night/i)).toBeInTheDocument();
  });

  it('shows the file upload button for photos', () => {
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse([]));
    render(<LogPage onNavigate={vi.fn()} />);
    expect(screen.getByText(/add photos/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /location/i })).toBeInTheDocument();
  });

  it('surfaces the server error message when a photo upload is rejected (#201)', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockJsonResponse([])) // initial loadEntries
      .mockResolvedValueOnce(mockJsonResponse({ error: 'File too large. Maximum size is 20 MB.' }, false));

    render(<LogPage onNavigate={vi.fn()} />);

    const fileInput = screen.getByLabelText(/add photos/i);
    const bigFile = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, bigFile);

    await waitFor(() =>
      expect(screen.getByText(/file too large\. maximum size is 20 mb\./i)).toBeInTheDocument(),
    );
  });
});
