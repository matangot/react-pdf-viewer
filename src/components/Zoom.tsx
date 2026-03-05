import { usePdfViewerContext } from '../context';

export interface ZoomProps {
  className?: string;
}

export function Zoom({ className }: ZoomProps) {
  const { zoomLevel, zoomMode, zoomIn, zoomOut, zoomTo } =
    usePdfViewerContext();

  const classNames = ['pdf-viewer__zoom', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      <button
        className="pdf-viewer__btn"
        onClick={zoomOut}
        aria-label="Zoom out"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 8H12" />
        </svg>
      </button>
      <span>{Math.round(zoomLevel * 100)}%</span>
      <button
        className="pdf-viewer__btn"
        onClick={zoomIn}
        aria-label="Zoom in"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 4V12M4 8H12" />
        </svg>
      </button>
      <button
        className={`pdf-viewer__btn${zoomMode === 'fit-width' ? ' pdf-viewer__btn--active' : ''}`}
        onClick={() => zoomTo('fit-width')}
        aria-label="Fit width"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 4V12M14 4V12M4 8H12" />
        </svg>
      </button>
      <button
        className={`pdf-viewer__btn${zoomMode === 'fit-page' ? ' pdf-viewer__btn--active' : ''}`}
        onClick={() => zoomTo('fit-page')}
        aria-label="Fit page"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="2" width="10" height="12" rx="1" />
        </svg>
      </button>
    </div>
  );
}
