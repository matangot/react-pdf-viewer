import { usePdfViewerContext } from '../context';

export interface ThumbnailToggleProps {
  className?: string;
}

export function ThumbnailToggle({ className }: ThumbnailToggleProps) {
  const { toggleThumbnails, isThumbnailsOpen } = usePdfViewerContext();

  const classNames = [
    'pdf-viewer__btn',
    isThumbnailsOpen ? 'pdf-viewer__btn--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      onClick={toggleThumbnails}
      aria-label="Toggle thumbnails"
      aria-pressed={isThumbnailsOpen}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="4" height="5" rx="0.5" />
        <rect x="2" y="9" width="4" height="5" rx="0.5" />
        <path d="M9 3h5M9 6h3M9 10h5M9 13h3" />
      </svg>
    </button>
  );
}
