import { Root } from './Root';
import { Toolbar } from './Toolbar';
import { Navigation } from './Navigation';
import { Zoom } from './Zoom';
import { Search } from './Search';
import { Separator } from './Separator';
import { Rotate } from './Rotate';
import { Download } from './Download';
import { Print } from './Print';
import { FullScreen } from './FullScreen';
import { ThumbnailToggle } from './ThumbnailToggle';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { Pages } from './Pages';
import { Page } from './Page';
import type { PdfViewerProps } from '../types';

export function PdfViewer(props: PdfViewerProps) {
  const { className, ...rootProps } = props;

  return (
    <Root className={className} {...rootProps}>
      <Toolbar>
        <Navigation />
        <Separator />
        <Zoom />
        <Separator />
        <Search />
        <Separator />
        <Rotate />
        <Download />
        <Print />
        <FullScreen />
        <ThumbnailToggle />
      </Toolbar>
      <div className="pdf-viewer__body">
        <ThumbnailSidebar />
        <Pages />
      </div>
    </Root>
  );
}

// Attach compound components
PdfViewer.Root = Root;
PdfViewer.Toolbar = Toolbar;
PdfViewer.Navigation = Navigation;
PdfViewer.Zoom = Zoom;
PdfViewer.Search = Search;
PdfViewer.Separator = Separator;
PdfViewer.Rotate = Rotate;
PdfViewer.Download = Download;
PdfViewer.Print = Print;
PdfViewer.FullScreen = FullScreen;
PdfViewer.ThumbnailToggle = ThumbnailToggle;
PdfViewer.ThumbnailSidebar = ThumbnailSidebar;
PdfViewer.Pages = Pages;
PdfViewer.Page = Page;
