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
  SunMoon,
  Download as DownloadIcon,
  Keyboard,
  Feather,
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
  { icon: <ArrowLeftRight size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Navigation', desc: 'Prev/next, page jump, or scroll — works with keyboard, touch, and mouse' },
  { icon: <ZoomIn size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Zoom', desc: 'Pinch-to-zoom on mobile, fit-width, fit-page, or set any scale you need' },
  { icon: <SearchIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Search', desc: 'Ctrl+F search across the entire document with highlighted matches' },
  { icon: <Feather size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Lightweight', desc: 'Under 20 KB gzipped — just a thin, focused layer on top of pdf.js' },
  { icon: <SunMoon size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Theming', desc: 'Light, dark, or match the system — fully customizable via CSS variables' },
  { icon: <DownloadIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Print & Download', desc: 'One-click download with custom filenames and native print dialog' },
  { icon: <Keyboard size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Keyboard Shortcuts', desc: 'Navigate, zoom, and search without touching the mouse' },
  { icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE} />, title: 'Compound Components', desc: 'Pick only the pieces you need and arrange them however you want' },
];

/* ── Main App ── */
const packageManagers = [
  { name: 'npm', command: 'npm install @matangot/react-pdf-viewer' },
  { name: 'pnpm', command: 'pnpm add @matangot/react-pdf-viewer' },
  { name: 'yarn', command: 'yarn add @matangot/react-pdf-viewer' },
  { name: 'bun', command: 'bun add @matangot/react-pdf-viewer' },
] as const;

export function App() {
  const [copied, setCopied] = useState(false);
  const [pm, setPm] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(packageManagers[pm].command);
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
        <h1 className="hero__title">The PDF Viewer<br />React Has Been Missing</h1>
        <p className="hero__subtitle">Under 20 KB gzipped. Navigation, search, zoom, thumbnails, and theming — all out of the box.</p>
        <div className="hero__stats">
          <div className="hero__stat">
            <span className="hero__stat-value">&lt;20 KB</span>
            <span className="hero__stat-label">Gzipped</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-value">TypeScript</span>
            <span className="hero__stat-label">First</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-value">MIT</span>
            <span className="hero__stat-label">Licensed</span>
          </div>
        </div>
        <div className="hero__install">
          <div className="hero__pm-tabs">
            {packageManagers.map((p, i) => (
              <button
                key={p.name}
                className={`hero__pm-tab${i === pm ? ' hero__pm-tab--active' : ''}`}
                onClick={() => setPm(i)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="hero__install-row">
            <code>{packageManagers[pm].command}</code>
            <button className="hero__copy-btn" onClick={handleCopy} aria-label="Copy install command">
              {copied ? <Check size={16} strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}
            </button>
          </div>
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
        <h2 className="section__heading">Single import. All of this.</h2>
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
