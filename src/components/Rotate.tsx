import { usePdfViewerContext } from '../context';

export interface RotateProps {
  className?: string;
}

export function Rotate({ className }: RotateProps) {
  const { rotate } = usePdfViewerContext();

  const classNames = ['pdf-viewer__btn', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      onClick={() => rotate()}
      aria-label="Rotate clockwise"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 8a6 6 0 0 1 10.2-4.2L14 2v4h-4l1.8-1.8A4 4 0 1 0 12 8" />
      </svg>
    </button>
  );
}
