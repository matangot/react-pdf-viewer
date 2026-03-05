import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  PdfViewer,
  Toolbar,
  Navigation,
  Zoom,
  Search,
  Download,
  Print,
  FullScreen,
  ThumbnailToggle,
  ThumbnailSidebar,
  Pages,
  MoreMenu,
  DocumentPropertiesModal,
  CursorModeToggle,
} from '../src';
import { Sun, Moon } from '../src/icons';
import type { Theme } from '../src/types';
import '../src/styles.css';
import { GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function App() {
  const [theme, setTheme] = useState<Theme>('system');
  const resolved = getResolvedTheme(theme);

  const toggleTheme = () => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  };

  return (
    <PdfViewer.Root
      src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
      theme={theme}
    >
      <Toolbar>
        <div className="pdf-viewer__toolbar-section">
          <ThumbnailToggle />
          <Navigation />
          <CursorModeToggle className="pdf-viewer__hide-mobile" />
          <Search />
        </div>
        <div className="pdf-viewer__toolbar-section pdf-viewer__toolbar-section--center">
          <Zoom />
        </div>
        <div className="pdf-viewer__toolbar-section pdf-viewer__toolbar-section--end">
          <button
            className="pdf-viewer__btn pdf-viewer__hide-mobile"
            onClick={toggleTheme}
            title={resolved === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label={resolved === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {resolved === 'dark' ? <Sun /> : <Moon />}
          </button>
          <Download className="pdf-viewer__hide-mobile" />
          <Print className="pdf-viewer__hide-mobile" />
          <FullScreen className="pdf-viewer__hide-mobile" />
          <MoreMenu className="pdf-viewer__more-menu" />
        </div>
      </Toolbar>
      <div className="pdf-viewer__body">
        <ThumbnailSidebar />
        <Pages />
      </div>
      <DocumentPropertiesModal />
    </PdfViewer.Root>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
