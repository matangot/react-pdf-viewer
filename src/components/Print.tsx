import { usePdfViewerContext } from '../context';

export interface PrintProps {
  className?: string;
}

export function Print({ className }: PrintProps) {
  const { print } = usePdfViewerContext();

  const classNames = ['pdf-viewer__btn', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      onClick={print}
      aria-label="Print PDF"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6V2h8v4M4 12H2V8h12v4h-2M4 10h8v4H4z" />
      </svg>
    </button>
  );
}
