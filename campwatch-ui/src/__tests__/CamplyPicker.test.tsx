import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CamplyPicker } from '../components/CamplyPicker';
import { mockJsonResponse } from './testUtils';

describe('CamplyPicker', () => {
  it('loads seed items and selects a campground', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({
      items: [{ id: '458', name: 'Hocking Hills State Park' }],
      provider: 'OhioStateParks',
    }));

    render(
      <CamplyPicker
        provider="OhioStateParks"
        searchType="campgrounds"
        value={[]}
        onChange={onChange}
        label="Campground"
        singleSelect
        initQuery=""
      />,
    );

    await user.click(await screen.findByRole('button', { name: /browse 1 options/i }));
    await user.click(screen.getByRole('button', { name: /hocking hills state park/i }));

    expect(onChange).toHaveBeenCalledWith(['458']);
  });

  it('shows disabled placeholder when provider is missing', () => {
    render(
      <CamplyPicker
        provider=""
        searchType="campgrounds"
        value={[]}
        onChange={() => undefined}
        label="Campground"
        disabled
      />,
    );

    expect(screen.getByPlaceholderText(/select a provider first/i)).toBeDisabled();
  });

  it('can remove a selected value', async () => {
    const user = userEvent.setup();

    render(
      <CamplyPicker
        provider="OhioStateParks"
        searchType="campgrounds"
        value={['458']}
        onChange={() => undefined}
        label="Campground"
        singleSelect
      />,
    );

    await waitFor(() => expect(screen.getByText('458')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '×' }));
  });

  it('shows the Browse button OR the filter input, not both (#206)', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(mockJsonResponse({
      items: [{ id: '458', name: 'Hocking Hills State Park' }],
      provider: 'OhioStateParks',
    }));

    render(
      <CamplyPicker
        provider="OhioStateParks"
        searchType="campgrounds"
        value={[]}
        onChange={() => undefined}
        label="Campground"
        singleSelect
        initQuery=""
      />,
    );

    const browse = await screen.findByRole('button', { name: /browse 1 options/i });
    // Filter input is hidden while the Browse affordance is the entry point
    expect(screen.queryByPlaceholderText(/filter options/i)).not.toBeInTheDocument();

    await user.click(browse);
    // Opening the list swaps in the filter input and hides the Browse button
    expect(screen.getByPlaceholderText(/filter options/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /browse 1 options/i })).not.toBeInTheDocument();
  });
});
