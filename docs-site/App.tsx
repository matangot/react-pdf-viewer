import { useState } from 'react';
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
import {
  ArrowLeftRight,
  ZoomIn,
  Search as SearchIcon,
  PanelLeft,
  SunMoon,
  Download as DownloadIcon,
  Keyboard,
  Blocks,
  Github,
  Package,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

const PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

/* ── Syntax highlighting ── */
function highlight(code: string) {
  const keywords = ['import', 'from', 'function', 'return', 'const', 'export'];
  const lines = code.split('\n');

  return lines.map((line, i) => {
    const tokens: { text: string; className?: string }[] = [];
    const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$|\b(?:import|from|function|return|const|export)\b|<\/?[A-Z][\w.]*\s*\/?>?|[A-Z][\w.]*(?=\s*[({<\/])?|\b(?:src|theme|defaultZoom|pdfUrl|fileName)\b)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ text: line.slice(lastIndex, match.index) });
      }

      const text = match[0];
      if (text.startsWith('"') || text.startsWith("'")) {
        tokens.push({ text, className: 'string' });
      } else if (text.startsWith('//')) {
        tokens.push({ text, className: 'comment' });
      } else if (keywords.includes(text)) {
        tokens.push({ text, className: 'keyword' });
      } else if (['src', 'theme', 'defaultZoom', 'pdfUrl', 'fileName'].includes(text)) {
        tokens.push({ text, className: 'attr' });
      } else if (/^[A-Z]/.test(text) || text.startsWith('<') || text.startsWith('</')) {
        const tagMatch = text.match(/^(<\/?)([A-Z][\w.]*)(.*)/);
        if (tagMatch) {
          tokens.push({ text: tagMatch[1] });
          tokens.push({ text: tagMatch[2], className: 'component' });
          if (tagMatch[3]) tokens.push({ text: tagMatch[3] });
        } else {
          tokens.push({ text, className: 'component' });
        }
      } else {
        tokens.push({ text });
      }

      lastIndex = match.index + text.length;
    }

    if (lastIndex < line.length) {
      tokens.push({ text: line.slice(lastIndex) });
    }

    return (
      <span key={i}>
        {tokens.map((t, j) =>
          t.className ? (
            <span key={j} className={t.className}>{t.text}</span>
          ) : (
            <span key={j}>{t.text}</span>
          )
        )}
        {i < lines.length - 1 ? '\n' : ''}
      </span>
    );
  });
}

const quickStartCode = `import { PdfViewer } from '@matangot/react-pdf-viewer';
import '@matangot/react-pdf-viewer/styles.css';

function App() {
  return (
    <PdfViewer
      src="/document.pdf"
      defaultZoom="fit-width"
      theme="system"
    />
  );
}`;

const compoundCode = `import { PdfViewer } from '@matangot/react-pdf-viewer';
import '@matangot/react-pdf-viewer/styles.css';

function CustomViewer() {
  return (
    <PdfViewer.Root src={pdfUrl} theme="dark">
      <PdfViewer.Toolbar>
        <PdfViewer.Navigation />
        <PdfViewer.Separator />
        <PdfViewer.Zoom />
        <PdfViewer.Separator />
        <PdfViewer.Search />
        <PdfViewer.Download />
        <PdfViewer.Print />
        <PdfViewer.FullScreen />
      </PdfViewer.Toolbar>
      <PdfViewer.Pages />
    </PdfViewer.Root>
  );
}`;

const ICON_SIZE = 18;
const ICON_STROKE = 1.5;

const features = [
  { icon: <ArrowLeftRight size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Navigation', desc: 'Page-by-page or jump to any page with keyboard shortcuts' },
  { icon: <ZoomIn size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Zoom', desc: 'Fit width, fit page, or precise zoom control' },
  { icon: <SearchIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Search', desc: 'Full-text search with match highlighting and navigation' },
  { icon: <PanelLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Thumbnails', desc: 'Sidebar with page thumbnails for quick navigation' },
  { icon: <SunMoon size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Theming', desc: 'Light, dark, and system themes with CSS custom properties' },
  { icon: <DownloadIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Print & Download', desc: 'Native print dialog and one-click file download' },
  { icon: <Keyboard size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Keyboard Shortcuts', desc: 'Full keyboard navigation out of the box' },
  { icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Compound Components', desc: 'Full control over layout and which features to show' },
];

/* ── Main App ── */
export function App() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install @matangot/react-pdf-viewer');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="site">
      {/* ── Nav ── */}
      <nav className="nav">
        <div className="nav__inner">
          <a href="/" className="nav__logo">
            <span className="nav__logo-icon"><FileText size={16} strokeWidth={2} /></span>
            React PDF Viewer
          </a>
          <div className="nav__links">
            <a href="https://github.com/matangot/react-pdf-viewer" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="nav__icon-link">
              <Github size={20} strokeWidth={1.5} />
            </a>
            <a href="https://www.npmjs.com/package/@matangot/react-pdf-viewer" target="_blank" rel="noopener noreferrer" aria-label="npm" className="nav__icon-link">
              <Package size={20} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <h1 className="hero__title">A Beautiful PDF Viewer for React</h1>
        <p className="hero__subtitle">Fast, customizable, and powered by pdf.js. Drop it into any React app.</p>
        <div className="hero__install">
          <code>npm install @matangot/react-pdf-viewer</code>
          <button className="hero__copy-btn" onClick={handleCopy} aria-label="Copy install command">
            {copied ? <Check size={16} strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section className="section section--demo">
        <div className="demo-container">
          <PdfViewer.Root src={PDF_URL} theme="dark">
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
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section">
        <h2 className="section__heading">Everything you need</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Code Examples ── */}
      <section className="section">
        <h2 className="section__heading">Get started in seconds</h2>
        <div className="code-examples">
          <div className="code-block">
            <div className="code-block__header">Quick Start</div>
            <pre className="code-block__body"><code>{highlight(quickStartCode)}</code></pre>
          </div>
          <div className="code-block">
            <div className="code-block__header">Compound Components</div>
            <pre className="code-block__body"><code>{highlight(compoundCode)}</code></pre>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <span>MIT License</span>
        <span className="footer__dot">&middot;</span>
        <a href="https://github.com/matangot/react-pdf-viewer" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span className="footer__dot">&middot;</span>
        <a href="https://www.npmjs.com/package/@matangot/react-pdf-viewer" target="_blank" rel="noopener noreferrer">npm</a>
      </footer>
    </div>
  );
}
