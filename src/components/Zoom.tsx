import { usePdfViewerContext } from '../context';
import { Minus, Plus, ArrowLeftRight, RectangleVertical } from '../icons';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from './DropdownMenu';

export interface ZoomProps {
  className?: string;
}

const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export function Zoom({ className }: ZoomProps) {
  const { zoomLevel, zoomMode, zoomIn, zoomOut, zoomTo } =
    usePdfViewerContext();

  const classNames = ['pdf-viewer__zoom', className]
    .filter(Boolean)
    .join(' ');

  const displayPercent = `${Math.round(zoomLevel * 20) * 5}%`;

  const isPresetActive = (preset: number) =>
    !zoomMode && Math.abs(zoomLevel - preset) < 0.01;

  return (
    <div className={classNames}>
      <button
        className="pdf-viewer__btn"
        onClick={zoomOut}
        title="Zoom out"
        aria-label="Zoom out"
      >
        <Minus />
      </button>
      <DropdownMenu
        trigger={<span className="pdf-viewer__zoom-level-text">{displayPercent}</span>}
        triggerClassName="pdf-viewer__zoom-trigger"
        title="Zoom level"
        align="center"
        className="pdf-viewer__zoom-dropdown"
      >
        {ZOOM_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset}
            label={`${Math.round(preset * 100)}%`}
            onClick={() => zoomTo(preset)}
            active={isPresetActive(preset)}
          />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          icon={<ArrowLeftRight />}
          label="Fit Width"
          onClick={() => zoomTo('fit-width')}
          active={zoomMode === 'fit-width'}
        />
        <DropdownMenuItem
          icon={<RectangleVertical />}
          label="Fit Page"
          onClick={() => zoomTo('fit-page')}
          active={zoomMode === 'fit-page'}
        />
      </DropdownMenu>
      <button
        className="pdf-viewer__btn"
        onClick={zoomIn}
        title="Zoom in"
        aria-label="Zoom in"
      >
        <Plus />
      </button>
    </div>
  );
}
