import { usePdfViewerContext } from '../context';
import { PanelLeft } from '../icons';

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
      title="Toggle sidebar"
      aria-label="Toggle thumbnails"
      aria-pressed={isThumbnailsOpen}
    >
      <PanelLeft />
    </button>
  );
}
