import { useState } from 'react';
import type { ChecklistItem } from '../types/camping';

interface ChecklistBuilderProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export default function ChecklistBuilder({ items, onChange }: ChecklistBuilderProps) {
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { text, done: false }]);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addItem(); } }}
          placeholder="Add another checklist item"
          aria-label="Checklist item"
        />
        <button
          type="button"
          onClick={addItem}
          className="btn btn-primary btn-sm shrink-0"
        >
          Add item
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item.text}-${index}`}
            className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface2)] px-3 py-2"
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={() =>
                onChange(items.map((current, currentIndex) => (
                  currentIndex === index ? { ...current, done: !current.done } : current
                )))
              }
              aria-label={`Mark ${item.text} complete`}
            />
            <span className={`flex-1 text-sm ${item.done ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'}`}>
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, currentIndex) => currentIndex != index))}
              className="text-sm text-[var(--error)]"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
