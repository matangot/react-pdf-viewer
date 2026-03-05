import { usePdfViewerContext } from '../context';
import { Expand } from '../icons';

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
      title="Full screen"
      aria-label="Toggle full screen"
    >
      <Expand />
    </button>
  );
}
