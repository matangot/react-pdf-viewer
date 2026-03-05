import { usePdfViewerContext } from '../context';

export interface DownloadProps {
  fileName?: string;
  className?: string;
}

export function Download({ fileName, className }: DownloadProps) {
  const { download } = usePdfViewerContext();

  const classNames = ['pdf-viewer__btn', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      onClick={() => download(fileName)}
      aria-label="Download PDF"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 2v8M4 7l4 4 4-4M2 13h12" />
      </svg>
    </button>
  );
}
