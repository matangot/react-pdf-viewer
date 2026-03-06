# @matangot/react-pdf-viewer

A fast, customizable React PDF viewer component powered by pdf.js. Works with Next.js, Vite, CRA, and any React environment.

## Features

- Navigation (prev/next, page jump, keyboard shortcuts)
- Zoom (in/out, fit-width, fit-page)
- Search with match highlighting
- Download with custom filename
- Print
- Full screen
- Rotation
- Thumbnail sidebar
- Light/dark/system theme
- Compound components for full layout control
- CSS custom properties for easy theming

## Installation

```bash
npm install @matangot/react-pdf-viewer react react-dom pdfjs-dist
```

### Setup pdf.js worker

```ts
import { GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
```

## Quick Start

```tsx
import { PdfViewer } from '@matangot/react-pdf-viewer';
import '@matangot/react-pdf-viewer/styles.css';

function App() {
  return (
    <PdfViewer
      src="https://example.com/document.pdf"
      defaultPage={1}
      defaultZoom="fit-width"
      theme="system"
    />
  );
}
```

## Compound Components

For full control over layout and which actions to show:

```tsx
import { PdfViewer } from '@matangot/react-pdf-viewer';
import '@matangot/react-pdf-viewer/styles.css';

function CustomViewer() {
  return (
    <PdfViewer.Root src={pdfUrl} theme="dark">
      <PdfViewer.Toolbar>
        <PdfViewer.Navigation />
        <PdfViewer.Separator />
        <PdfViewer.Zoom />
        <PdfViewer.Separator />
        <PdfViewer.Download fileName="report.pdf" />
        <PdfViewer.Print />
        <PdfViewer.FullScreen />
      </PdfViewer.Toolbar>
      <PdfViewer.Pages />
    </PdfViewer.Root>
  );
}
```

## Programmatic Access

```tsx
import { usePdfViewer } from '@matangot/react-pdf-viewer';

function CustomControls() {
  const { currentPage, totalPages, zoomIn, goToPage } = usePdfViewer();

  return (
    <div>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={zoomIn}>Zoom In</button>
      <button onClick={() => goToPage(1)}>Go to First Page</button>
    </div>
  );
}
```

## Props

### `<PdfViewer>` / `<PdfViewer.Root>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string \| File \| ArrayBuffer \| Uint8Array` | — | PDF source (required) |
| `defaultPage` | `number` | `1` | Initial page |
| `defaultZoom` | `number \| 'fit-width' \| 'fit-page'` | `1` | Initial zoom |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `onPageChange` | `(page: number) => void` | — | Page change callback |
| `onDocumentLoad` | `(info: DocumentInfo) => void` | — | Document load callback |
| `className` | `string` | — | Additional CSS class |

### `<PdfViewer.Download>`

| Prop | Type | Description |
|------|------|-------------|
| `fileName` | `string` | Override downloaded file name |

## Theming

Override CSS custom properties to customize the look:

```css
.pdf-viewer {
  --pdf-toolbar-bg: #1a1a2e;
  --pdf-toolbar-color: #ffffff;
  --pdf-toolbar-height: 48px;
  --pdf-sidebar-width: 200px;
  --pdf-page-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --pdf-page-gap: 16px;
  --pdf-search-highlight: rgba(255, 230, 0, 0.4);
  --pdf-font-family: system-ui, sans-serif;
}
```

For a completely custom look, skip importing `styles.css` and style from scratch using the BEM class names.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Arrow Left` / `Page Up` | Previous page |
| `Arrow Right` / `Page Down` | Next page |
| `Ctrl/Cmd + =` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `Ctrl/Cmd + 0` | Reset zoom |
| `Ctrl/Cmd + F` | Focus search |
| `Enter` | Next search match |
| `Shift + Enter` | Previous search match |

## Support

<a href="https://www.buymeacoffee.com/matangot" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## License

MIT
