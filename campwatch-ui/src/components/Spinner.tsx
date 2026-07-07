export default function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--accent)]"
    />
  );
}
