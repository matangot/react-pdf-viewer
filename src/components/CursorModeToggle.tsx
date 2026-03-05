import { usePdfViewerContext } from '../context';
import { Hand, MousePointer } from '../icons';

export interface CursorModeToggleProps {
  className?: string;
}

export function CursorModeToggle({ className }: CursorModeToggleProps) {
  const { cursorMode, toggleCursorMode } = usePdfViewerContext();

  const classNames = ['pdf-viewer__btn', className].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      onClick={toggleCursorMode}
      title={cursorMode === 'select' ? 'Hand Tool' : 'Selection Mode'}
      aria-label={cursorMode === 'select' ? 'Hand Tool' : 'Selection Mode'}
    >
      {cursorMode === 'select' ? <Hand /> : <MousePointer />}
    </button>
  );
}
