import type { ReactNode } from 'react';

type PageWidth = 'narrow' | 'medium' | 'wide';

const WIDTH_CLASS: Record<PageWidth, string> = {
  narrow: 'max-w-2xl',
  medium: 'max-w-5xl',
  wide: 'max-w-7xl',
};

interface PageShellProps {
  children: ReactNode;
  width?: PageWidth;
  noPad?: boolean;
  align?: 'optical' | 'top';
}

export default function PageShell({ children, width = 'medium', noPad = false, align = 'optical' }: PageShellProps) {
  return (
    <div className="page-root flex w-full flex-col items-center">
      <div
        className={`flex w-full flex-col px-4 md:px-6 ${WIDTH_CLASS[width]}`}
        style={{ minHeight: 'calc(100vh - var(--topbar-h))' }}
      >
        {/* optical-centre spacers: 2 parts above, 3 parts below → content sits at ~40% from top */}
        {align === 'optical' && <div className="flex-[2]" aria-hidden="true" />}
        <div className={`w-full ${noPad ? '' : 'py-8'}`}>
          {children}
        </div>
        {align === 'optical' && <div className="flex-[3]" aria-hidden="true" />}
      </div>
    </div>
  );
}
