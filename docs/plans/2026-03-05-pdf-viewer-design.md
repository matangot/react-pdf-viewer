# @matangot/react-pdf-viewer — Design Document

## Overview

A fast, customizable React PDF viewer component that works in any React environment (Next.js, Vite, CRA, etc.). Provides both a batteries-included default viewer and compound components for full layout control.

**Peer dependencies:** `react`, `react-dom`, `pdfjs-dist`
**Build:** tsup, ESM-only, TypeScript
**Styling:** Plain CSS with custom properties, light/dark mode, BEM naming

## Architecture

Canvas-based rendering via pdf.js `page.render()` with a transparent text layer overlay for selection and search. Pages are virtualized using intersection observers (current page +/- 2).

A React context provider (`PdfViewerProvider`) holds all state: document instance, current page, zoom level, rotation, search state, sidebar visibility. All child components consume this context.

```
PdfViewerProvider
├── Toolbar
│   ├── Navigation (prev/next, page input, page count)
│   ├── Zoom (in/out, fit-width, fit-page, percentage)
│   ├── Search (input, prev/next match, highlight)
│   ├── Rotate, Download, Print, FullScreen, ThumbnailToggle
├── ThumbnailSidebar (collapsible, off by default)
└── PageContainer (virtualized scroll)
    └── Page (canvas + text layer)
```

## Component API

### Quick usage (batteries-included)

```jsx
import { PdfViewer } from '@matangot/react-pdf-viewer';
import '@matangot/react-pdf-viewer/styles.css';

<PdfViewer
  src="https://example.com/doc.pdf"
  defaultPage={1}
  defaultZoom="fit-width"
  theme="system"
/>
```

### Full customization (compound components)

```jsx
<PdfViewer.Root src={file} theme="dark">
  <PdfViewer.Toolbar className="my-toolbar">
    <PdfViewer.Navigation />
    <PdfViewer.Zoom />
    <PdfViewer.Search />
    <PdfViewer.Separator />
    <PdfViewer.Rotate />
    <PdfViewer.Download fileName="report.pdf" />
    <PdfViewer.Print />
    <PdfViewer.FullScreen />
    <PdfViewer.ThumbnailToggle />
  </PdfViewer.Toolbar>
  <PdfViewer.ThumbnailSidebar />
  <PdfViewer.Pages />
</PdfViewer.Root>
```

### Programmatic access

```jsx
const {
  currentPage, totalPages,
  zoomIn, zoomOut, zoomLevel,
  goToPage, rotate,
  // ...
} = usePdfViewer();
```

### Props on `<PdfViewer>` / `<PdfViewer.Root>`

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string \| File \| ArrayBuffer \| Uint8Array` | PDF source |
| `defaultPage` | `number` | Initial page (default: 1) |
| `defaultZoom` | `number \| 'fit-width' \| 'fit-page'` | Initial zoom |
| `theme` | `'light' \| 'dark' \| 'system'` | Color theme (default: `'system'`) |
| `onPageChange` | `(page: number) => void` | Page change callback |
| `onDocumentLoad` | `(doc: DocumentInfo) => void` | Load callback |
| `className` | `string` | Container class |

Every sub-component accepts a `className` prop.

## Features (v1)

### Navigation
- Prev/next buttons (disabled at bounds)
- Text input for direct page jump with validation
- "Page X of Y" display
- Keyboard: Arrow keys, Page Up/Down

### Zoom
- Zoom in/out buttons, configurable step (default: 25%)
- Fit-to-width and fit-to-page presets
- Clickable percentage display for custom value input
- Keyboard: Ctrl+/-, Ctrl+0 for reset
- Bounds: 25%–400%

### Search
- Text input with match count display
- Prev/next match navigation
- Highlighted matches on text layer (current match in distinct color)
- Keyboard: Ctrl+F to focus, Enter/Shift+Enter for next/prev

### Download
- Programmatic download via blob URL + anchor click
- `fileName` prop to override downloaded file name
- Works with all source types

### Print
- Renders all pages to hidden high-res canvases, triggers `window.print()`
- Scoped print CSS so only PDF content prints

### Full Screen
- Uses Fullscreen API on viewer container
- Graceful fallback if unavailable
- Toolbar remains visible

### Rotation
- Rotates all pages by 90-degree increments
- Persists across page navigation

### Thumbnails
- Sidebar with low-res canvas renders, off by default
- Click to navigate, current page highlighted
- Lazy-rendered as user scrolls sidebar
- Toggle button in toolbar

## Styling & Theming

**CSS custom properties** for all visual tokens. **BEM naming** with `pdf-viewer` prefix. Light and dark mode via `data-theme` attribute, with `prefers-color-scheme` media query for `system` mode.

```css
.pdf-viewer, .pdf-viewer[data-theme="light"] {
  --pdf-toolbar-bg: #ffffff;
  --pdf-toolbar-color: #1a1a1a;
  --pdf-toolbar-height: 48px;
  --pdf-btn-hover-bg: rgba(0, 0, 0, 0.06);
  --pdf-btn-active-bg: rgba(0, 0, 0, 0.1);
  --pdf-btn-border-radius: 4px;
  --pdf-sidebar-width: 200px;
  --pdf-sidebar-bg: #f5f5f5;
  --pdf-search-highlight: rgba(255, 230, 0, 0.4);
  --pdf-search-current: rgba(255, 150, 0, 0.6);
  --pdf-page-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --pdf-page-gap: 16px;
  --pdf-font-family: system-ui, sans-serif;
  --pdf-font-size: 14px;
}

.pdf-viewer[data-theme="dark"] {
  --pdf-toolbar-bg: #1a1a2e;
  --pdf-toolbar-color: #ffffff;
  --pdf-sidebar-bg: #2a2a3e;
  /* ... */
}

@media (prefers-color-scheme: dark) {
  .pdf-viewer[data-theme="system"] {
    /* dark values */
  }
}
```

Users can skip importing `styles.css` and style from scratch using class names as reference.

## Technical Decisions

- **Canvas + text layer** for rendering (pixel-perfect, full control, search/selection support)
- **Intersection observers** for page virtualization (no external dependency)
- **ESM-only** distribution via tsup
- **pdf.js as peer dependency** — users control the version
- **No CSS-in-JS runtime** — plain CSS with custom properties
