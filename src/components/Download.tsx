import { usePdfViewerContext } from '../context';
import { Download as DownloadIcon } from '../icons';

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
      title="Download"
      aria-label="Download PDF"
    >
      <DownloadIcon />
    </button>
  );
}
