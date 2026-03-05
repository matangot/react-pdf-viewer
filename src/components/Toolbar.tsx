import type { ReactNode } from 'react';

export interface ToolbarProps {
  className?: string;
  children: ReactNode;
}

export function Toolbar({ className, children }: ToolbarProps) {
  const classNames = ['pdf-viewer__toolbar', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="toolbar">
      {children}
    </div>
  );
}
