import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ChecklistBuilder from '../components/ChecklistBuilder';

describe('ChecklistBuilder', () => {
  it('adds and toggles checklist items', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ChecklistBuilder items={[{ text: 'Pack tent', done: false }]} onChange={onChange} />);

    await user.type(screen.getByLabelText(/checklist item/i), 'Pack socks');
    await user.click(screen.getByRole('button', { name: /add item/i }));
    expect(onChange).toHaveBeenCalledWith([
      { text: 'Pack tent', done: false },
      { text: 'Pack socks', done: false },
    ]);

    await user.click(screen.getByRole('checkbox', { name: /mark pack tent complete/i }));
    expect(onChange).toHaveBeenCalledWith([{ text: 'Pack tent', done: true }]);
  });
});
