import { usePdfViewerContext } from '../context';
import { RotateCw } from '../icons';

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
      title="Rotate"
      aria-label="Rotate clockwise"
    >
      <RotateCw />
    </button>
  );
}
