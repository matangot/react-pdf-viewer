import { usePdfViewerContext } from '../context';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from './DropdownMenu';
import {
  ArrowDownToLine,
  RotateCw,
  RotateCcw,
  StickyNote,
  Columns2,
  GalleryThumbnails,
  GalleryVertical,
  GalleryHorizontal,
  Info,
  EllipsisVertical,
  Download as DownloadIcon,
  Printer,
  Maximize,
} from '../icons';

export interface MoreMenuProps {
  className?: string;
}

export function MoreMenu({ className }: MoreMenuProps) {
  const {
    currentPage,
    totalPages,
    rotate,
    viewMode,
    scrollMode,
    setViewMode,
    setScrollMode,
    goToFirstPage,
    goToLastPage,
    openDocProperties,
    download,
    print,
    toggleFullScreen,
  } = usePdfViewerContext();

  return (
    <DropdownMenu trigger={<EllipsisVertical />} className={className} align="right">
      <div className="pdf-viewer__show-mobile">
        <DropdownMenuItem
          icon={<DownloadIcon />}
          label="Download"
          onClick={() => download()}
        />
        <DropdownMenuItem
          icon={<Printer />}
          label="Print"
          onClick={print}
        />
        <DropdownMenuItem
          icon={<Maximize />}
          label="Full Screen"
          onClick={toggleFullScreen}
        />
        <DropdownMenuSeparator />
      </div>
      <DropdownMenuItem
        icon={<ArrowDownToLine style={{ transform: 'rotate(180deg)' }} />}
        label="First Page"
        onClick={goToFirstPage}
        disabled={currentPage <= 1}
      />
      <DropdownMenuItem
        icon={<ArrowDownToLine />}
        label="Last Page"
        onClick={goToLastPage}
        disabled={currentPage >= totalPages}
      />
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={<RotateCw />}
        label="Rotate Clockwise"
        onClick={() => rotate(90)}
      />
      <DropdownMenuItem
        icon={<RotateCcw />}
        label="Rotate Counterclockwise"
        onClick={() => rotate(-90)}
      />
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={<StickyNote />}
        label="Single Page"
        onClick={() => setViewMode('single')}
        active={viewMode === 'single'}
      />
      <DropdownMenuItem
        icon={<Columns2 />}
        label="Dual Page"
        onClick={() => setViewMode('dual')}
        active={viewMode === 'dual'}
        disabled={scrollMode === 'horizontal'}
      />
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={<GalleryThumbnails />}
        label="Page Scrolling"
        onClick={() => setScrollMode('page')}
        active={scrollMode === 'page'}
      />
      <DropdownMenuItem
        icon={<GalleryVertical />}
        label="Vertical Scrolling"
        onClick={() => setScrollMode('vertical')}
        active={scrollMode === 'vertical'}
      />
      <DropdownMenuItem
        icon={<GalleryHorizontal />}
        label="Horizontal Scrolling"
        onClick={() => setScrollMode('horizontal')}
        active={scrollMode === 'horizontal'}
        disabled={viewMode === 'dual'}
      />
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={<Info />}
        label="Document Properties"
        onClick={openDocProperties}
      />
    </DropdownMenu>
  );
}
