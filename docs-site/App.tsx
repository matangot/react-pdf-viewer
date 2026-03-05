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
import { Sun, Moon } from '../src/icons';
import type { Theme } from '../src/types';

const PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

/* ── Syntax highlighting helper ── */
function highlight(code: string) {
  const keywords = ['import', 'from', 'function', 'return', 'const', 'export'];
  const lines = code.split('\n');

  return lines.map((line, i) => {
    let result: (string | JSX.Element)[] = [];
    let remaining = line;
    let key = 0;

    // Process the line character by character using regex replacements
    // We'll use a simple sequential approach
    const tokens: { text: string; className?: string }[] = [];

    // Tokenize
    const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\/\/.*$|\b(?:import|from|function|return|const|export)\b|<\/?[A-Z][\w.]*\s*\/?>?|[A-Z][\w.]*(?=\s*[({<\/])?|\b(?:src|theme|defaultZoom|pdfUrl)\b)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(remaining)) !== null) {
      // Add plain text before match
      if (match.index > lastIndex) {
        tokens.push({ text: remaining.slice(lastIndex, match.index) });
      }

      const text = match[0];
      if (text.startsWith('"') || text.startsWith("'")) {
        tokens.push({ text, className: 'string' });
      } else if (text.startsWith('//')) {
        tokens.push({ text, className: 'comment' });
      } else if (keywords.includes(text)) {
        tokens.push({ text, className: 'keyword' });
      } else if (text === 'src' || text === 'theme' || text === 'defaultZoom' || text === 'pdfUrl') {
        tokens.push({ text, className: 'attr' });
      } else if (/^[A-Z]/.test(text) || text.startsWith('<') || text.startsWith('</')) {
        // Component-like
        // Extract component name from JSX tag
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

    // Add remaining text
    if (lastIndex < remaining.length) {
      tokens.push({ text: remaining.slice(lastIndex) });
    }

    result = tokens.map((t, j) =>
      t.className ? (
        <span key={j} className={t.className}>{t.text}</span>
      ) : (
        <span key={j}>{t.text}</span>
      )
    );

    return (
      <span key={i}>
        {result}
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

const features = [
  { icon: '\u{1F9ED}', title: 'Navigation', desc: 'Page-by-page or jump to any page with keyboard shortcuts' },
  { icon: '\u{1F50D}', title: 'Zoom', desc: 'Fit width, fit page, or precise zoom control' },
  { icon: '\u{1F50E}', title: 'Search', desc: 'Full-text search with match highlighting and navigation' },
  { icon: '\u{1F4D1}', title: 'Thumbnails', desc: 'Sidebar with page thumbnails for quick navigation' },
  { icon: '\u{1F3A8}', title: 'Theming', desc: 'Light, dark, and system themes with CSS custom properties' },
  { icon: '\u{1F5A8}\uFE0F', title: 'Print & Download', desc: 'Native print dialog and one-click file download' },
  { icon: '\u2328\uFE0F', title: 'Keyboard Shortcuts', desc: 'Full keyboard navigation out of the box' },
  { icon: '\u{1F9F1}', title: 'Compound Components', desc: 'Full control over layout and which features to show' },
];

/* ── Icons ── */
function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function NpmIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323h13.74v13.04H15.5V8.692h-3.37v9.671H5.13z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* ── Main App ── */
export function App() {
  const [theme, setTheme] = useState<Theme>('system');
  const resolved = getResolvedTheme(theme);
  const [copied, setCopied] = useState(false);

  const toggleTheme = () => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  };

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
          <a href="/" className="nav__logo">@matangot/react-pdf-viewer</a>
          <div className="nav__links">
            <a href="https://github.com/matangot/react-pdf-viewer" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="nav__icon-link">
              <GitHubIcon />
            </a>
            <a href="https://www.npmjs.com/package/@matangot/react-pdf-viewer" target="_blank" rel="noopener noreferrer" aria-label="npm" className="nav__icon-link">
              <NpmIcon />
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
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section className="section">
        <div className="demo-container">
          <PdfViewer.Root src={PDF_URL} theme={theme}>
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
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section">
        <h2 className="section__heading">Everything you need</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-card__icon">{f.icon}</span>
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
