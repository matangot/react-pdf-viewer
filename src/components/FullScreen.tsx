import { usePdfViewerContext } from '../context';

export interface FullScreenProps {
  className?: string;
}

export function FullScreen({ className }: FullScreenProps) {
  const { toggleFullScreen } = usePdfViewerContext();

  const classNames = ['pdf-viewer__btn', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      onClick={toggleFullScreen}
      aria-label="Toggle full screen"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
      </svg>
    </button>
  );
}
