import { usePdfViewerContext } from '../context';
import { Printer } from '../icons';

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
      title="Print"
      aria-label="Print PDF"
    >
      <Printer />
    </button>
  );
}
