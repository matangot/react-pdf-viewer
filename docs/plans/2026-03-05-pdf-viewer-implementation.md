# @matangot/react-pdf-viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a customizable React PDF viewer npm package with compound components, powered by pdf.js.

**Architecture:** React context provider holds pdf.js document + viewer state. Canvas + text layer rendering per page. Intersection observer virtualization. Compound components for toolbar actions. Batteries-included wrapper for quick usage.

**Tech Stack:** React 18+, TypeScript, pdfjs-dist, tsup (ESM build), vitest + @testing-library/react (tests), plain CSS with custom properties.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `.gitignore`
- Create: `src/index.ts` (empty placeholder)

**Step 1: Initialize package.json**

```bash
cd /Users/matan/playground/pdf-viewer
cat > package.json << 'JSONEOF'
{
  "name": "@matangot/react-pdf-viewer",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist"],
  "sideEffects": ["*.css"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "pdfjs-dist": ">=3.0.0"
  },
  "devDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pdfjs-dist": "^4.0.0",
    "typescript": "^5.4.0",
    "tsup": "^8.0.0",
    "vitest": "^1.6.0",
    "@testing-library/react": "^15.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^24.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
JSONEOF
```

**Step 2: Create tsconfig.json**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

**Step 3: Create tsup.config.ts**

Create `tsup.config.ts`:
```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'pdfjs-dist'],
  sourcemap: true,
});
```

**Step 4: Create .gitignore**

```
node_modules
dist
.DS_Store
```

**Step 5: Create vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

Create `src/test-setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

**Step 6: Create placeholder entry**

Create `src/index.ts`:
```ts
export {};
```

**Step 7: Install dependencies and verify build**

```bash
npm install
npm run build
```

Expected: Clean build producing `dist/index.js` and `dist/index.d.ts`.

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold project with tsup, vitest, and typescript"
```

---

### Task 2: Types & Constants

**Files:**
- Create: `src/types.ts`
- Create: `src/constants.ts`

**Step 1: Define core types**

Create `src/types.ts`:
```ts
export type PdfSource = string | File | ArrayBuffer | Uint8Array;

export type ZoomMode = 'fit-width' | 'fit-page';
export type ZoomValue = number | ZoomMode;
export type Theme = 'light' | 'dark' | 'system';

export interface DocumentInfo {
  numPages: number;
  title?: string;
  author?: string;
}

export interface SearchMatch {
  pageIndex: number;
  matchIndex: number;
}

export interface PdfViewerState {
  document: import('pdfjs-dist').PDFDocumentProxy | null;
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  zoomMode: ZoomMode | null;
  rotation: number;
  isThumbnailsOpen: boolean;
  searchQuery: string;
  searchMatches: SearchMatch[];
  currentMatchIndex: number;
}

export interface PdfViewerActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (value: ZoomValue) => void;
  rotate: (degrees?: number) => void;
  toggleThumbnails: () => void;
  search: (query: string) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  clearSearch: () => void;
  download: (fileName?: string) => void;
  print: () => void;
  toggleFullScreen: () => void;
}

export type PdfViewerContextValue = PdfViewerState & PdfViewerActions;

export interface PdfViewerRootProps {
  src: PdfSource;
  defaultPage?: number;
  defaultZoom?: ZoomValue;
  theme?: Theme;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (info: DocumentInfo) => void;
  className?: string;
  children: React.ReactNode;
}

export interface PdfViewerProps extends Omit<PdfViewerRootProps, 'children'> {
  // Batteries-included: no children needed
}
```

**Step 2: Define constants**

Create `src/constants.ts`:
```ts
export const DEFAULT_ZOOM = 1;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 0.25;
export const VIRTUALIZATION_BUFFER = 2;
export const THUMBNAIL_SCALE = 0.2;
```

**Step 3: Commit**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: add core types and constants"
```

---

### Task 3: PDF Loading Hook

**Files:**
- Create: `src/hooks/use-pdf-document.ts`
- Create: `src/hooks/__tests__/use-pdf-document.test.ts`

**Step 1: Write the failing test**

Create `src/hooks/__tests__/use-pdf-document.test.ts`:
```ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePdfDocument } from '../use-pdf-document';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}));

import { getDocument } from 'pdfjs-dist';

const mockDoc = {
  numPages: 5,
  getMetadata: vi.fn().mockResolvedValue({
    info: { Title: 'Test', Author: 'Author' },
  }),
  getPage: vi.fn(),
  getData: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  destroy: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
    promise: Promise.resolve(mockDoc),
  });
});

describe('usePdfDocument', () => {
  it('loads a PDF from a URL string', async () => {
    const onLoad = vi.fn();
    const { result } = renderHook(() =>
      usePdfDocument('https://example.com/test.pdf', onLoad)
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.document).toBe(mockDoc);
    expect(result.current.error).toBeNull();
    expect(onLoad).toHaveBeenCalledWith({
      numPages: 5,
      title: 'Test',
      author: 'Author',
    });
  });

  it('sets error state on load failure', async () => {
    (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
      promise: Promise.reject(new Error('Load failed')),
    });

    const { result } = renderHook(() => usePdfDocument('bad-url'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.document).toBeNull();
    expect(result.current.error?.message).toBe('Load failed');
  });

  it('accepts a Uint8Array source', async () => {
    const data = new Uint8Array([1, 2, 3]);
    const { result } = renderHook(() => usePdfDocument(data));

    await waitFor(() => {
      expect(result.current.document).toBe(mockDoc);
    });

    expect(getDocument).toHaveBeenCalledWith({ data });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/hooks/__tests__/use-pdf-document.test.ts
```
Expected: FAIL — module not found.

**Step 3: Implement the hook**

Create `src/hooks/use-pdf-document.ts`:
```ts
import { useState, useEffect, useRef } from 'react';
import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfSource, DocumentInfo } from '../types';

export function usePdfDocument(
  src: PdfSource,
  onDocumentLoad?: (info: DocumentInfo) => void
) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const prevSrcRef = useRef<PdfSource | null>(null);

  useEffect(() => {
    if (src === prevSrcRef.current) return;
    prevSrcRef.current = src;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const loadingTask = getDocument(getDocumentInit(src));

    loadingTask.promise
      .then(async (doc) => {
        if (cancelled) {
          doc.destroy();
          return;
        }
        setDocument(doc);
        setIsLoading(false);

        const metadata = await doc.getMetadata();
        const info = metadata.info as Record<string, string> | null;
        onDocumentLoad?.({
          numPages: doc.numPages,
          title: info?.Title,
          author: info?.Author,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { document, isLoading, error };
}

function getDocumentInit(src: PdfSource) {
  if (typeof src === 'string') {
    return { url: src };
  }
  if (src instanceof File) {
    return { url: URL.createObjectURL(src) };
  }
  // ArrayBuffer or Uint8Array
  return { data: src };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/hooks/__tests__/use-pdf-document.test.ts
```
Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add usePdfDocument hook for PDF loading"
```

---

### Task 4: PdfViewerProvider (Context)

**Files:**
- Create: `src/context.tsx`
- Create: `src/__tests__/context.test.tsx`

**Step 1: Write the failing test**

Create `src/__tests__/context.test.tsx`:
```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PdfViewerProvider, usePdfViewerContext } from '../context';

// Mock the usePdfDocument hook
vi.mock('../hooks/use-pdf-document', () => ({
  usePdfDocument: vi.fn().mockReturnValue({
    document: {
      numPages: 10,
      getPage: vi.fn(),
      getData: vi.fn().mockResolvedValue(new Uint8Array([1])),
      destroy: vi.fn(),
    },
    isLoading: false,
    error: null,
  }),
}));

function TestConsumer() {
  const ctx = usePdfViewerContext();
  return (
    <div>
      <span data-testid="page">{ctx.currentPage}</span>
      <span data-testid="total">{ctx.totalPages}</span>
      <span data-testid="zoom">{ctx.zoomLevel}</span>
      <span data-testid="rotation">{ctx.rotation}</span>
      <button onClick={ctx.nextPage}>next</button>
      <button onClick={ctx.prevPage}>prev</button>
      <button onClick={ctx.zoomIn}>zoomIn</button>
      <button onClick={ctx.zoomOut}>zoomOut</button>
      <button onClick={() => ctx.rotate()}>rotate</button>
    </div>
  );
}

describe('PdfViewerProvider', () => {
  it('provides initial state', () => {
    render(
      <PdfViewerProvider src="test.pdf">
        <TestConsumer />
      </PdfViewerProvider>
    );

    expect(screen.getByTestId('page').textContent).toBe('1');
    expect(screen.getByTestId('total').textContent).toBe('10');
    expect(screen.getByTestId('zoom').textContent).toBe('1');
    expect(screen.getByTestId('rotation').textContent).toBe('0');
  });

  it('navigates pages', () => {
    render(
      <PdfViewerProvider src="test.pdf">
        <TestConsumer />
      </PdfViewerProvider>
    );

    act(() => screen.getByText('next').click());
    expect(screen.getByTestId('page').textContent).toBe('2');

    act(() => screen.getByText('prev').click());
    expect(screen.getByTestId('page').textContent).toBe('1');

    // Should not go below 1
    act(() => screen.getByText('prev').click());
    expect(screen.getByTestId('page').textContent).toBe('1');
  });

  it('zooms in and out', () => {
    render(
      <PdfViewerProvider src="test.pdf">
        <TestConsumer />
      </PdfViewerProvider>
    );

    act(() => screen.getByText('zoomIn').click());
    expect(screen.getByTestId('zoom').textContent).toBe('1.25');

    act(() => screen.getByText('zoomOut').click());
    expect(screen.getByTestId('zoom').textContent).toBe('1');
  });

  it('rotates by 90 degrees', () => {
    render(
      <PdfViewerProvider src="test.pdf">
        <TestConsumer />
      </PdfViewerProvider>
    );

    act(() => screen.getByText('rotate').click());
    expect(screen.getByTestId('rotation').textContent).toBe('90');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/context.test.tsx
```
Expected: FAIL.

**Step 3: Implement the context**

Create `src/context.tsx`:
```tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { usePdfDocument } from './hooks/use-pdf-document';
import {
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
} from './constants';
import type {
  PdfSource,
  ZoomValue,
  ZoomMode,
  Theme,
  DocumentInfo,
  SearchMatch,
  PdfViewerContextValue,
} from './types';

const PdfViewerContext = createContext<PdfViewerContextValue | null>(null);

export function usePdfViewerContext(): PdfViewerContextValue {
  const ctx = useContext(PdfViewerContext);
  if (!ctx) {
    throw new Error('usePdfViewerContext must be used within a PdfViewerProvider');
  }
  return ctx;
}

interface PdfViewerProviderProps {
  src: PdfSource;
  defaultPage?: number;
  defaultZoom?: ZoomValue;
  theme?: Theme;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (info: DocumentInfo) => void;
  children: ReactNode;
}

export function PdfViewerProvider({
  src,
  defaultPage = 1,
  defaultZoom = DEFAULT_ZOOM,
  onPageChange,
  onDocumentLoad,
  children,
}: PdfViewerProviderProps) {
  const { document, isLoading, error } = usePdfDocument(src, onDocumentLoad);
  const totalPages = document?.numPages ?? 0;

  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [zoomLevel, setZoomLevel] = useState(
    typeof defaultZoom === 'number' ? defaultZoom : DEFAULT_ZOOM
  );
  const [zoomMode, setZoomMode] = useState<ZoomMode | null>(
    typeof defaultZoom === 'string' ? defaultZoom : null
  );
  const [rotation, setRotation] = useState(0);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
      onPageChange?.(clamped);
    },
    [totalPages, onPageChange]
  );

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  const zoomIn = useCallback(() => {
    setZoomMode(null);
    setZoomLevel((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomMode(null);
    setZoomLevel((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const zoomTo = useCallback((value: ZoomValue) => {
    if (typeof value === 'number') {
      setZoomMode(null);
      setZoomLevel(Math.max(MIN_ZOOM, Math.min(value, MAX_ZOOM)));
    } else {
      setZoomMode(value);
    }
  }, []);

  const rotate = useCallback((degrees = 90) => {
    setRotation((r) => (r + degrees) % 360);
  }, []);

  const toggleThumbnails = useCallback(() => {
    setIsThumbnailsOpen((o) => !o);
  }, []);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    // Actual search logic will be handled by the Pages component
    // which has access to text content
  }, []);

  const nextMatch = useCallback(() => {
    setCurrentMatchIndex((i) =>
      searchMatches.length === 0 ? -1 : (i + 1) % searchMatches.length
    );
  }, [searchMatches.length]);

  const prevMatch = useCallback(() => {
    setCurrentMatchIndex((i) =>
      searchMatches.length === 0
        ? -1
        : (i - 1 + searchMatches.length) % searchMatches.length
    );
  }, [searchMatches.length]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  }, []);

  const download = useCallback(
    async (fileName?: string) => {
      if (!document) return;
      const data = await document.getData();
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = fileName ?? 'document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    },
    [document]
  );

  const print = useCallback(() => {
    // Will be implemented in print component — triggers window.print()
    window.print();
  }, []);

  const toggleFullScreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.document.fullscreenElement) {
      window.document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }, []);

  const value = useMemo<PdfViewerContextValue>(
    () => ({
      document,
      isLoading,
      error,
      currentPage,
      totalPages,
      zoomLevel,
      zoomMode,
      rotation,
      isThumbnailsOpen,
      searchQuery,
      searchMatches,
      currentMatchIndex,
      goToPage,
      nextPage,
      prevPage,
      zoomIn,
      zoomOut,
      zoomTo,
      rotate,
      toggleThumbnails,
      search,
      nextMatch,
      prevMatch,
      clearSearch,
      download,
      print,
      toggleFullScreen,
    }),
    [
      document, isLoading, error, currentPage, totalPages,
      zoomLevel, zoomMode, rotation, isThumbnailsOpen,
      searchQuery, searchMatches, currentMatchIndex,
      goToPage, nextPage, prevPage, zoomIn, zoomOut, zoomTo,
      rotate, toggleThumbnails, search, nextMatch, prevMatch,
      clearSearch, download, print, toggleFullScreen,
    ]
  );

  return (
    <PdfViewerContext.Provider value={value}>
      {children}
    </PdfViewerContext.Provider>
  );
}

// Export ref setter for Root component to attach
export { PdfViewerContext };
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/__tests__/context.test.tsx
```
Expected: PASS.

**Step 5: Commit**

```bash
git add src/context.tsx src/__tests__/
git commit -m "feat: add PdfViewerProvider context with state and actions"
```

---

### Task 5: Page Rendering Component

**Files:**
- Create: `src/components/Page.tsx`
- Create: `src/components/__tests__/Page.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/Page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Page } from '../Page';

// Mock context
const mockContext = {
  document: {
    getPage: vi.fn().mockResolvedValue({
      getViewport: vi.fn().mockReturnValue({ width: 612, height: 792, scale: 1 }),
      render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
      getTextContent: vi.fn().mockResolvedValue({ items: [] }),
    }),
  },
  zoomLevel: 1,
  rotation: 0,
  searchQuery: '',
  searchMatches: [],
  currentMatchIndex: -1,
};

vi.mock('../../context', () => ({
  usePdfViewerContext: () => mockContext,
}));

describe('Page', () => {
  it('renders a canvas wrapper with correct page number', () => {
    const { container } = render(<Page pageNumber={1} />);
    const wrapper = container.querySelector('.pdf-viewer__page');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.getAttribute('data-page-number')).toBe('1');
  });

  it('contains a canvas element', () => {
    const { container } = render(<Page pageNumber={1} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/__tests__/Page.test.tsx
```

**Step 3: Implement Page component**

Create `src/components/Page.tsx`:
```tsx
import { useEffect, useRef, useCallback } from 'react';
import { usePdfViewerContext } from '../context';

interface PageProps {
  pageNumber: number;
  className?: string;
}

export function Page({ pageNumber, className }: PageProps) {
  const { document, zoomLevel, rotation } = usePdfViewerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const renderPage = useCallback(async () => {
    if (!document || !canvasRef.current) return;

    // Cancel previous render
    renderTaskRef.current?.cancel();

    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: zoomLevel, rotation });

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = viewport.width * pixelRatio;
    canvas.height = viewport.height * pixelRatio;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const renderTask = page.render({ canvasContext: context, viewport });
    renderTaskRef.current = renderTask;

    try {
      await renderTask.promise;
    } catch {
      // Render was cancelled — ignore
    }

    // Text layer
    if (textLayerRef.current) {
      const textContent = await page.getTextContent();
      const textLayer = textLayerRef.current;
      textLayer.innerHTML = '';
      textLayer.style.width = `${viewport.width}px`;
      textLayer.style.height = `${viewport.height}px`;

      // Use pdfjs text layer rendering
      const { renderTextLayer } = await import('pdfjs-dist');
      renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport,
      });
    }
  }, [document, pageNumber, zoomLevel, rotation]);

  useEffect(() => {
    renderPage();
    return () => {
      renderTaskRef.current?.cancel();
    };
  }, [renderPage]);

  const classes = ['pdf-viewer__page', className].filter(Boolean).join(' ');

  return (
    <div className={classes} data-page-number={String(pageNumber)}>
      <canvas ref={canvasRef} className="pdf-viewer__page-canvas" />
      <div ref={textLayerRef} className="pdf-viewer__page-text-layer" />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/components/__tests__/Page.test.tsx
```

**Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add Page component with canvas + text layer rendering"
```

---

### Task 6: Pages Container (Virtualized Scroll)

**Files:**
- Create: `src/components/Pages.tsx`
- Create: `src/components/__tests__/Pages.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/Pages.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Pages } from '../Pages';

vi.mock('../../context', () => ({
  usePdfViewerContext: () => ({
    document: {
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 612, height: 792, scale: 1 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
        getTextContent: vi.fn().mockResolvedValue({ items: [] }),
      }),
    },
    totalPages: 5,
    currentPage: 1,
    zoomLevel: 1,
    rotation: 0,
    goToPage: vi.fn(),
    searchQuery: '',
    searchMatches: [],
    currentMatchIndex: -1,
  }),
}));

// Mock IntersectionObserver
const observeMock = vi.fn();
const disconnectMock = vi.fn();
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => ({
    observe: observeMock,
    disconnect: disconnectMock,
    unobserve: vi.fn(),
  }))
);

describe('Pages', () => {
  it('renders the scroll container', () => {
    const { container } = render(<Pages />);
    expect(container.querySelector('.pdf-viewer__pages')).toBeInTheDocument();
  });

  it('renders page placeholders for all pages', () => {
    const { container } = render(<Pages />);
    const placeholders = container.querySelectorAll('[data-page-number]');
    expect(placeholders.length).toBe(5);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/__tests__/Pages.test.tsx
```

**Step 3: Implement Pages component**

Create `src/components/Pages.tsx`:
```tsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { usePdfViewerContext } from '../context';
import { Page } from './Page';
import { VIRTUALIZATION_BUFFER } from '../constants';

interface PagesProps {
  className?: string;
}

export function Pages({ className }: PagesProps) {
  const { totalPages, currentPage, goToPage } = usePdfViewerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());

  // Track which pages are in/near viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const pageNum = Number(
              (entry.target as HTMLElement).dataset.pageNumber
            );
            if (entry.isIntersecting) {
              next.add(pageNum);
            } else {
              next.delete(pageNum);
            }
          }
          return next;
        });
      },
      {
        root: container,
        rootMargin: '200px 0px',
        threshold: 0,
      }
    );

    const pageElements = container.querySelectorAll('[data-page-number]');
    pageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [totalPages]);

  // Update current page based on scroll position
  useEffect(() => {
    if (visiblePages.size > 0) {
      const minVisible = Math.min(...visiblePages);
      if (minVisible !== currentPage) {
        goToPage(minVisible);
      }
    }
  }, [visiblePages, currentPage, goToPage]);

  const shouldRenderPage = useCallback(
    (pageNum: number) => {
      if (visiblePages.has(pageNum)) return true;
      // Render pages within buffer of any visible page
      for (const visible of visiblePages) {
        if (Math.abs(visible - pageNum) <= VIRTUALIZATION_BUFFER) return true;
      }
      // Always render near current page on initial load
      return Math.abs(pageNum - currentPage) <= VIRTUALIZATION_BUFFER;
    },
    [visiblePages, currentPage]
  );

  const classes = ['pdf-viewer__pages', className].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={classes}>
      {Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        return (
          <div
            key={pageNum}
            data-page-number={String(pageNum)}
            className="pdf-viewer__page-wrapper"
          >
            {shouldRenderPage(pageNum) ? (
              <Page pageNumber={pageNum} />
            ) : (
              <div className="pdf-viewer__page-placeholder" />
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 4: Run tests**

```bash
npm test -- src/components/__tests__/Pages.test.tsx
```

**Step 5: Commit**

```bash
git add src/components/Pages.tsx src/components/__tests__/Pages.test.tsx
git commit -m "feat: add Pages container with intersection observer virtualization"
```

---

### Task 7: Toolbar Action Components (Navigation, Zoom, Rotate)

**Files:**
- Create: `src/components/Toolbar.tsx`
- Create: `src/components/Navigation.tsx`
- Create: `src/components/Zoom.tsx`
- Create: `src/components/Rotate.tsx`
- Create: `src/components/Separator.tsx`
- Create: `src/components/__tests__/Navigation.test.tsx`
- Create: `src/components/__tests__/Zoom.test.tsx`

**Step 1: Write failing tests for Navigation**

Create `src/components/__tests__/Navigation.test.tsx`:
```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navigation } from '../Navigation';

const mockContext = {
  currentPage: 3,
  totalPages: 10,
  goToPage: vi.fn(),
  nextPage: vi.fn(),
  prevPage: vi.fn(),
};

vi.mock('../../context', () => ({
  usePdfViewerContext: () => mockContext,
}));

describe('Navigation', () => {
  it('displays current page and total', () => {
    render(<Navigation />);
    expect(screen.getByText('of 10')).toBeInTheDocument();
  });

  it('calls prevPage on prev button click', () => {
    render(<Navigation />);
    act(() => screen.getByLabelText('Previous page').click());
    expect(mockContext.prevPage).toHaveBeenCalled();
  });

  it('calls nextPage on next button click', () => {
    render(<Navigation />);
    act(() => screen.getByLabelText('Next page').click());
    expect(mockContext.nextPage).toHaveBeenCalled();
  });
});
```

**Step 2: Write failing tests for Zoom**

Create `src/components/__tests__/Zoom.test.tsx`:
```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Zoom } from '../Zoom';

const mockContext = {
  zoomLevel: 1,
  zoomMode: null,
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  zoomTo: vi.fn(),
};

vi.mock('../../context', () => ({
  usePdfViewerContext: () => mockContext,
}));

describe('Zoom', () => {
  it('displays zoom percentage', () => {
    render(<Zoom />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls zoomIn on click', () => {
    render(<Zoom />);
    act(() => screen.getByLabelText('Zoom in').click());
    expect(mockContext.zoomIn).toHaveBeenCalled();
  });

  it('calls zoomOut on click', () => {
    render(<Zoom />);
    act(() => screen.getByLabelText('Zoom out').click());
    expect(mockContext.zoomOut).toHaveBeenCalled();
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
npm test -- src/components/__tests__/Navigation.test.tsx src/components/__tests__/Zoom.test.tsx
```

**Step 4: Implement components**

Create `src/components/Toolbar.tsx`:
```tsx
import type { ReactNode } from 'react';

interface ToolbarProps {
  className?: string;
  children: ReactNode;
}

export function Toolbar({ className, children }: ToolbarProps) {
  const classes = ['pdf-viewer__toolbar', className].filter(Boolean).join(' ');
  return (
    <div className={classes} role="toolbar">
      {children}
    </div>
  );
}
```

Create `src/components/Navigation.tsx`:
```tsx
import { useState, type KeyboardEvent } from 'react';
import { usePdfViewerContext } from '../context';

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const { currentPage, totalPages, goToPage, nextPage, prevPage } =
    usePdfViewerContext();
  const [inputValue, setInputValue] = useState(String(currentPage));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(inputValue, 10);
      if (!isNaN(page)) {
        goToPage(page);
      }
    }
  };

  // Sync input when currentPage changes externally
  if (String(currentPage) !== inputValue && document.activeElement?.tagName !== 'INPUT') {
    setInputValue(String(currentPage));
  }

  const classes = ['pdf-viewer__navigation', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <button
        className="pdf-viewer__btn"
        onClick={prevPage}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>
      <span className="pdf-viewer__page-info">
        <input
          className="pdf-viewer__page-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setInputValue(String(currentPage))}
          aria-label="Page number"
        />
        <span>of {totalPages}</span>
      </span>
      <button
        className="pdf-viewer__btn"
        onClick={nextPage}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>
    </div>
  );
}
```

Create `src/components/Zoom.tsx`:
```tsx
import { usePdfViewerContext } from '../context';

interface ZoomProps {
  className?: string;
}

export function Zoom({ className }: ZoomProps) {
  const { zoomLevel, zoomMode, zoomIn, zoomOut, zoomTo } = usePdfViewerContext();

  const displayZoom = Math.round(zoomLevel * 100);
  const classes = ['pdf-viewer__zoom', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <button className="pdf-viewer__btn" onClick={zoomOut} aria-label="Zoom out">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 8h10" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <span className="pdf-viewer__zoom-level">{displayZoom}%</span>
      <button className="pdf-viewer__btn" onClick={zoomIn} aria-label="Zoom in">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <button
        className={`pdf-viewer__btn ${zoomMode === 'fit-width' ? 'pdf-viewer__btn--active' : ''}`}
        onClick={() => zoomTo('fit-width')}
        aria-label="Fit width"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 4h12v8H2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M0 8h2M14 8h2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <button
        className={`pdf-viewer__btn ${zoomMode === 'fit-page' ? 'pdf-viewer__btn--active' : ''}`}
        onClick={() => zoomTo('fit-page')}
        aria-label="Fit page"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 2h10v12H3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
    </div>
  );
}
```

Create `src/components/Rotate.tsx`:
```tsx
import { usePdfViewerContext } from '../context';

interface RotateProps {
  className?: string;
}

export function Rotate({ className }: RotateProps) {
  const { rotate } = usePdfViewerContext();
  const classes = ['pdf-viewer__rotate', className].filter(Boolean).join(' ');

  return (
    <button
      className={`pdf-viewer__btn ${classes}`}
      onClick={() => rotate()}
      aria-label="Rotate clockwise"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M13 8A5 5 0 1 1 8 3h2M10 1l2 2-2 2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </button>
  );
}
```

Create `src/components/Separator.tsx`:
```tsx
interface SeparatorProps {
  className?: string;
}

export function Separator({ className }: SeparatorProps) {
  const classes = ['pdf-viewer__separator', className].filter(Boolean).join(' ');
  return <div className={classes} role="separator" />;
}
```

**Step 5: Run tests**

```bash
npm test -- src/components/__tests__/Navigation.test.tsx src/components/__tests__/Zoom.test.tsx
```

**Step 6: Commit**

```bash
git add src/components/Toolbar.tsx src/components/Navigation.tsx src/components/Zoom.tsx src/components/Rotate.tsx src/components/Separator.tsx src/components/__tests__/
git commit -m "feat: add Toolbar, Navigation, Zoom, Rotate, and Separator components"
```

---

### Task 8: Download, Print, FullScreen, ThumbnailToggle Components

**Files:**
- Create: `src/components/Download.tsx`
- Create: `src/components/Print.tsx`
- Create: `src/components/FullScreen.tsx`
- Create: `src/components/ThumbnailToggle.tsx`

**Step 1: Implement Download**

Create `src/components/Download.tsx`:
```tsx
import { usePdfViewerContext } from '../context';

interface DownloadProps {
  fileName?: string;
  className?: string;
}

export function Download({ fileName, className }: DownloadProps) {
  const { download } = usePdfViewerContext();
  const classes = ['pdf-viewer__download', className].filter(Boolean).join(' ');

  return (
    <button
      className={`pdf-viewer__btn ${classes}`}
      onClick={() => download(fileName)}
      aria-label="Download PDF"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M8 2v8M4 7l4 4 4-4M2 13h12"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </button>
  );
}
```

**Step 2: Implement Print**

Create `src/components/Print.tsx`:
```tsx
import { usePdfViewerContext } from '../context';

interface PrintProps {
  className?: string;
}

export function Print({ className }: PrintProps) {
  const { print } = usePdfViewerContext();
  const classes = ['pdf-viewer__print', className].filter(Boolean).join(' ');

  return (
    <button
      className={`pdf-viewer__btn ${classes}`}
      onClick={print}
      aria-label="Print PDF"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M4 4V1h8v3M4 11H2V7h12v4h-2M4 9h8v5H4z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </button>
  );
}
```

**Step 3: Implement FullScreen**

Create `src/components/FullScreen.tsx`:
```tsx
import { usePdfViewerContext } from '../context';

interface FullScreenProps {
  className?: string;
}

export function FullScreen({ className }: FullScreenProps) {
  const { toggleFullScreen } = usePdfViewerContext();
  const classes = ['pdf-viewer__fullscreen', className].filter(Boolean).join(' ');

  return (
    <button
      className={`pdf-viewer__btn ${classes}`}
      onClick={toggleFullScreen}
      aria-label="Toggle full screen"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </button>
  );
}
```

**Step 4: Implement ThumbnailToggle**

Create `src/components/ThumbnailToggle.tsx`:
```tsx
import { usePdfViewerContext } from '../context';

interface ThumbnailToggleProps {
  className?: string;
}

export function ThumbnailToggle({ className }: ThumbnailToggleProps) {
  const { toggleThumbnails, isThumbnailsOpen } = usePdfViewerContext();
  const classes = ['pdf-viewer__thumbnail-toggle', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={`pdf-viewer__btn ${classes} ${isThumbnailsOpen ? 'pdf-viewer__btn--active' : ''}`}
      onClick={toggleThumbnails}
      aria-label="Toggle thumbnails"
      aria-pressed={isThumbnailsOpen}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="5" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="1" y="9" width="5" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="8" y="1" width="7" height="14" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    </button>
  );
}
```

**Step 5: Commit**

```bash
git add src/components/Download.tsx src/components/Print.tsx src/components/FullScreen.tsx src/components/ThumbnailToggle.tsx
git commit -m "feat: add Download, Print, FullScreen, and ThumbnailToggle components"
```

---

### Task 9: Search Component

**Files:**
- Create: `src/components/Search.tsx`
- Create: `src/components/__tests__/Search.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/Search.test.tsx`:
```tsx
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Search } from '../Search';

const mockContext = {
  searchQuery: '',
  searchMatches: [],
  currentMatchIndex: -1,
  search: vi.fn(),
  nextMatch: vi.fn(),
  prevMatch: vi.fn(),
  clearSearch: vi.fn(),
};

vi.mock('../../context', () => ({
  usePdfViewerContext: () => mockContext,
}));

describe('Search', () => {
  it('renders search input', () => {
    render(<Search />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('calls search on input change', () => {
    render(<Search />);
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'hello' },
    });
    expect(mockContext.search).toHaveBeenCalledWith('hello');
  });

  it('calls nextMatch on Enter', () => {
    render(<Search />);
    fireEvent.keyDown(screen.getByPlaceholderText('Search...'), {
      key: 'Enter',
    });
    expect(mockContext.nextMatch).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/__tests__/Search.test.tsx
```

**Step 3: Implement Search**

Create `src/components/Search.tsx`:
```tsx
import { useRef, type KeyboardEvent } from 'react';
import { usePdfViewerContext } from '../context';

interface SearchProps {
  className?: string;
}

export function Search({ className }: SearchProps) {
  const {
    searchQuery,
    searchMatches,
    currentMatchIndex,
    search,
    nextMatch,
    prevMatch,
    clearSearch,
  } = usePdfViewerContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        prevMatch();
      } else {
        nextMatch();
      }
    }
    if (e.key === 'Escape') {
      clearSearch();
      inputRef.current?.blur();
    }
  };

  const matchDisplay =
    searchMatches.length > 0
      ? `${currentMatchIndex + 1} of ${searchMatches.length}`
      : searchQuery
        ? 'No matches'
        : '';

  const classes = ['pdf-viewer__search', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <input
        ref={inputRef}
        className="pdf-viewer__search-input"
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => search(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Search in document"
      />
      {matchDisplay && (
        <span className="pdf-viewer__search-count">{matchDisplay}</span>
      )}
      {searchMatches.length > 0 && (
        <>
          <button
            className="pdf-viewer__btn pdf-viewer__btn--small"
            onClick={prevMatch}
            aria-label="Previous match"
          >
            <svg width="12" height="12" viewBox="0 0 16 16">
              <path d="M12 10L8 6l-4 4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>
          <button
            className="pdf-viewer__btn pdf-viewer__btn--small"
            onClick={nextMatch}
            aria-label="Next match"
          >
            <svg width="12" height="12" viewBox="0 0 16 16">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/components/__tests__/Search.test.tsx
```

**Step 5: Commit**

```bash
git add src/components/Search.tsx src/components/__tests__/Search.test.tsx
git commit -m "feat: add Search component with match navigation"
```

---

### Task 10: Thumbnail Sidebar

**Files:**
- Create: `src/components/ThumbnailSidebar.tsx`

**Step 1: Implement ThumbnailSidebar**

Create `src/components/ThumbnailSidebar.tsx`:
```tsx
import { useEffect, useRef, useCallback } from 'react';
import { usePdfViewerContext } from '../context';
import { THUMBNAIL_SCALE } from '../constants';

interface ThumbnailSidebarProps {
  className?: string;
}

export function ThumbnailSidebar({ className }: ThumbnailSidebarProps) {
  const { document, totalPages, currentPage, goToPage, isThumbnailsOpen, rotation } =
    usePdfViewerContext();

  if (!isThumbnailsOpen) return null;

  const classes = ['pdf-viewer__sidebar', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {Array.from({ length: totalPages }, (_, i) => (
        <Thumbnail
          key={i + 1}
          pageNumber={i + 1}
          isActive={currentPage === i + 1}
          onClick={() => goToPage(i + 1)}
          document={document}
          rotation={rotation}
        />
      ))}
    </div>
  );
}

interface ThumbnailProps {
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
  document: any;
  rotation: number;
}

function Thumbnail({ pageNumber, isActive, onClick, document, rotation }: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderedRef = useRef(false);

  const renderThumbnail = useCallback(async () => {
    if (!document || !canvasRef.current || renderedRef.current) return;
    renderedRef.current = true;

    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: THUMBNAIL_SCALE, rotation });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
  }, [document, pageNumber, rotation]);

  useEffect(() => {
    // Lazy render using IntersectionObserver
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          renderThumbnail();
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [renderThumbnail]);

  // Re-render when rotation changes
  useEffect(() => {
    renderedRef.current = false;
    renderThumbnail();
  }, [rotation, renderThumbnail]);

  return (
    <button
      className={`pdf-viewer__thumbnail ${isActive ? 'pdf-viewer__thumbnail--active' : ''}`}
      onClick={onClick}
      aria-label={`Go to page ${pageNumber}`}
    >
      <canvas ref={canvasRef} className="pdf-viewer__thumbnail-canvas" />
      <span className="pdf-viewer__thumbnail-label">{pageNumber}</span>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ThumbnailSidebar.tsx
git commit -m "feat: add ThumbnailSidebar with lazy-rendered thumbnails"
```

---

### Task 11: Root Component & Compound Export

**Files:**
- Create: `src/components/Root.tsx`
- Create: `src/components/__tests__/Root.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/Root.test.tsx`:
```tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Root } from '../Root';

vi.mock('../../hooks/use-pdf-document', () => ({
  usePdfDocument: vi.fn().mockReturnValue({
    document: null,
    isLoading: true,
    error: null,
  }),
}));

describe('Root', () => {
  it('renders with correct theme attribute', () => {
    const { container } = render(
      <Root src="test.pdf" theme="dark">
        <div>content</div>
      </Root>
    );

    const root = container.querySelector('.pdf-viewer');
    expect(root).toBeInTheDocument();
    expect(root?.getAttribute('data-theme')).toBe('dark');
  });

  it('defaults to system theme', () => {
    const { container } = render(
      <Root src="test.pdf">
        <div>content</div>
      </Root>
    );

    const root = container.querySelector('.pdf-viewer');
    expect(root?.getAttribute('data-theme')).toBe('system');
  });

  it('shows loading state', () => {
    const { container } = render(
      <Root src="test.pdf">
        <div>content</div>
      </Root>
    );

    expect(container.querySelector('.pdf-viewer--loading')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/__tests__/Root.test.tsx
```

**Step 3: Implement Root**

Create `src/components/Root.tsx`:
```tsx
import { useRef, useEffect } from 'react';
import { PdfViewerProvider } from '../context';
import type { PdfViewerRootProps } from '../types';

export function Root({
  src,
  defaultPage,
  defaultZoom,
  theme = 'system',
  onPageChange,
  onDocumentLoad,
  className,
  children,
}: PdfViewerRootProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Keyboard shortcuts are handled by individual components
      // via context. This is a placeholder for global shortcuts like Ctrl+F.
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, []);

  const classes = [
    'pdf-viewer',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <PdfViewerProvider
      src={src}
      defaultPage={defaultPage}
      defaultZoom={defaultZoom}
      onPageChange={onPageChange}
      onDocumentLoad={onDocumentLoad}
    >
      <RootInner containerRef={containerRef} className={classes} theme={theme}>
        {children}
      </RootInner>
    </PdfViewerProvider>
  );
}

// Inner component that can access context
function RootInner({
  containerRef,
  className,
  theme,
  children,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  className: string;
  theme: string;
  children: React.ReactNode;
}) {
  // Import context to check loading state
  // We use a lazy import to avoid circular deps
  const { isLoading, error } = require('../context').usePdfViewerContext();

  const stateClass = isLoading
    ? 'pdf-viewer--loading'
    : error
      ? 'pdf-viewer--error'
      : '';

  return (
    <div
      ref={containerRef}
      className={`${className} ${stateClass}`.trim()}
      data-theme={theme}
      tabIndex={-1}
    >
      {error ? (
        <div className="pdf-viewer__error">
          <p>Failed to load PDF</p>
          <p className="pdf-viewer__error-message">{error.message}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
```

Note: The `require` above is a quick approach — during implementation, refactor `RootInner` to use the proper `usePdfViewerContext` import. The key point is that `RootInner` must be a child of `PdfViewerProvider` so it can consume context.

**Step 4: Run test**

```bash
npm test -- src/components/__tests__/Root.test.tsx
```

**Step 5: Commit**

```bash
git add src/components/Root.tsx src/components/__tests__/Root.test.tsx
git commit -m "feat: add Root compound component with theme and loading state"
```

---

### Task 12: Batteries-Included PdfViewer Component

**Files:**
- Create: `src/components/PdfViewer.tsx`
- Create: `src/components/__tests__/PdfViewer.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/PdfViewer.test.tsx`:
```tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PdfViewer } from '../PdfViewer';

vi.mock('../../hooks/use-pdf-document', () => ({
  usePdfDocument: vi.fn().mockReturnValue({
    document: {
      numPages: 3,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 612, height: 792, scale: 1 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
        getTextContent: vi.fn().mockResolvedValue({ items: [] }),
      }),
      getData: vi.fn().mockResolvedValue(new Uint8Array()),
      destroy: vi.fn(),
    },
    isLoading: false,
    error: null,
  }),
}));

vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }))
);

describe('PdfViewer', () => {
  it('renders toolbar and pages', () => {
    const { container } = render(<PdfViewer src="test.pdf" />);

    expect(container.querySelector('.pdf-viewer')).toBeInTheDocument();
    expect(container.querySelector('.pdf-viewer__toolbar')).toBeInTheDocument();
    expect(container.querySelector('.pdf-viewer__pages')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/__tests__/PdfViewer.test.tsx
```

**Step 3: Implement PdfViewer**

Create `src/components/PdfViewer.tsx`:
```tsx
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

// Attach compound components for PdfViewer.Root, PdfViewer.Toolbar, etc.
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
```

**Step 4: Run test**

```bash
npm test -- src/components/__tests__/PdfViewer.test.tsx
```

**Step 5: Commit**

```bash
git add src/components/PdfViewer.tsx src/components/__tests__/PdfViewer.test.tsx
git commit -m "feat: add batteries-included PdfViewer with compound component API"
```

---

### Task 13: usePdfViewer Hook (Public API)

**Files:**
- Create: `src/hooks/use-pdf-viewer.ts`

**Step 1: Implement the hook**

Create `src/hooks/use-pdf-viewer.ts`:
```ts
import { usePdfViewerContext } from '../context';

export function usePdfViewer() {
  return usePdfViewerContext();
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-pdf-viewer.ts
git commit -m "feat: add usePdfViewer public hook"
```

---

### Task 14: CSS Styles (Light + Dark Theme)

**Files:**
- Create: `src/styles.css`

**Step 1: Write the complete stylesheet**

Create `src/styles.css` with:
- Light theme (default)
- Dark theme
- System preference detection
- All component styles using BEM naming
- CSS custom properties for all visual tokens

See the design doc `docs/plans/2026-03-05-pdf-viewer-design.md` section "Styling & Theming" for the full list of CSS custom properties.

The stylesheet should cover:
- `.pdf-viewer` — root container, full height, flex column
- `.pdf-viewer__toolbar` — flex row, fixed height, centered items, gap
- `.pdf-viewer__btn` — icon button base styles, hover/active states
- `.pdf-viewer__btn--active` — active toggle state
- `.pdf-viewer__btn--small` — smaller button variant for search nav
- `.pdf-viewer__navigation` — flex row, centered
- `.pdf-viewer__page-input` — small text input for page number
- `.pdf-viewer__page-info` — flex row with gap
- `.pdf-viewer__zoom` — flex row, centered
- `.pdf-viewer__zoom-level` — monospace text
- `.pdf-viewer__search` — flex row with input and buttons
- `.pdf-viewer__search-input` — text input
- `.pdf-viewer__search-count` — small text
- `.pdf-viewer__separator` — vertical line divider
- `.pdf-viewer__body` — flex row, fill remaining height
- `.pdf-viewer__sidebar` — fixed width, scrollable column
- `.pdf-viewer__thumbnail` — button with canvas and label
- `.pdf-viewer__thumbnail--active` — highlighted border
- `.pdf-viewer__pages` — scrollable container, flex column, centered
- `.pdf-viewer__page-wrapper` — centers each page
- `.pdf-viewer__page` — relative positioning for text layer overlay
- `.pdf-viewer__page-canvas` — block display
- `.pdf-viewer__page-text-layer` — absolute overlay, transparent text
- `.pdf-viewer__page-placeholder` — gray box placeholder
- `.pdf-viewer__error` — centered error message
- `.pdf-viewer--loading` — loading state
- `@media print` — hide toolbar, show only pages
- Light/dark theme variables
- `@media (prefers-color-scheme: dark)` for system mode

**Step 2: Update tsup config to copy CSS**

Update `tsup.config.ts` to include the CSS file. tsup doesn't natively handle CSS copy — we need to either use the `esbuildOptions` or a simple copy in the build script.

Simplest approach: update `package.json` build script:
```json
"build": "tsup && cp src/styles.css dist/styles.css"
```

**Step 3: Commit**

```bash
git add src/styles.css tsup.config.ts package.json
git commit -m "feat: add CSS styles with light/dark theme and custom properties"
```

---

### Task 15: Package Exports & Index

**Files:**
- Modify: `src/index.ts`

**Step 1: Write the public API exports**

Update `src/index.ts`:
```ts
export { PdfViewer } from './components/PdfViewer';
export { Root } from './components/Root';
export { Toolbar } from './components/Toolbar';
export { Navigation } from './components/Navigation';
export { Zoom } from './components/Zoom';
export { Search } from './components/Search';
export { Separator } from './components/Separator';
export { Rotate } from './components/Rotate';
export { Download } from './components/Download';
export { Print } from './components/Print';
export { FullScreen } from './components/FullScreen';
export { ThumbnailToggle } from './components/ThumbnailToggle';
export { ThumbnailSidebar } from './components/ThumbnailSidebar';
export { Pages } from './components/Pages';
export { Page } from './components/Page';
export { usePdfViewer } from './hooks/use-pdf-viewer';

export type {
  PdfSource,
  ZoomMode,
  ZoomValue,
  Theme,
  DocumentInfo,
  PdfViewerProps,
  PdfViewerRootProps,
  PdfViewerContextValue,
} from './types';
```

**Step 2: Run full build**

```bash
npm run build
```
Expected: Clean build with `dist/index.js`, `dist/index.d.ts`, `dist/styles.css`.

**Step 3: Run all tests**

```bash
npm test
```
Expected: All tests pass.

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add public API exports"
```

---

### Task 16: Keyboard Shortcuts

**Files:**
- Create: `src/hooks/use-keyboard-shortcuts.ts`
- Modify: `src/components/Root.tsx` — integrate the hook

**Step 1: Implement keyboard shortcuts hook**

Create `src/hooks/use-keyboard-shortcuts.ts`:
```ts
import { useEffect } from 'react';
import type { PdfViewerContextValue } from '../types';

export function useKeyboardShortcuts(
  containerRef: React.RefObject<HTMLElement | null>,
  ctx: PdfViewerContextValue
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Navigation (only when not in input)
      if (!isInput) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          ctx.nextPage();
        }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          ctx.prevPage();
        }
      }

      // Zoom: Ctrl/Cmd + / -
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          ctx.zoomIn();
        }
        if (e.key === '-') {
          e.preventDefault();
          ctx.zoomOut();
        }
        if (e.key === '0') {
          e.preventDefault();
          ctx.zoomTo(1);
        }
        if (e.key === 'f') {
          e.preventDefault();
          // Focus search input
          const searchInput = el.querySelector<HTMLInputElement>('.pdf-viewer__search-input');
          searchInput?.focus();
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, ctx]);
}
```

**Step 2: Integrate into Root component**

Add `useKeyboardShortcuts(containerRef, ctx)` call inside `RootInner`.

**Step 3: Commit**

```bash
git add src/hooks/use-keyboard-shortcuts.ts src/components/Root.tsx
git commit -m "feat: add keyboard shortcuts for navigation, zoom, and search"
```

---

### Task 17: Demo App (for manual testing)

**Files:**
- Create: `demo/index.html`
- Create: `demo/main.tsx`
- Create: `demo/package.json`

**Step 1: Create a minimal Vite demo app**

Create `demo/package.json`:
```json
{
  "name": "pdf-viewer-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pdfjs-dist": "^4.0.0",
    "@matangot/react-pdf-viewer": "file:.."
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.4.0"
  }
}
```

Create `demo/index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>PDF Viewer Demo</title>
  <style>
    body { margin: 0; font-family: system-ui; }
    #root { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/main.tsx"></script>
</body>
</html>
```

Create `demo/main.tsx`:
```tsx
import { createRoot } from 'react-dom/client';
import { PdfViewer } from '@matangot/react-pdf-viewer';
import '@matangot/react-pdf-viewer/styles.css';
import { GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function App() {
  return (
    <PdfViewer
      src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
      theme="system"
    />
  );
}

createRoot(document.getElementById('root')!).render(<App />);
```

**Step 2: Run demo**

```bash
cd demo && npm install && npm run dev
```

Manually verify: PDF loads, toolbar visible, navigation works, zoom works, search works, thumbnails toggle, download/print/fullscreen/rotate all function.

**Step 3: Commit**

```bash
git add demo/
git commit -m "chore: add Vite demo app for manual testing"
```

---

### Task 18: Final Build Verification & README

**Files:**
- Create: `README.md`

**Step 1: Run full test suite**

```bash
npm test
```
Expected: All tests pass.

**Step 2: Run production build**

```bash
npm run build
```
Expected: `dist/` contains `index.js`, `index.d.ts`, `styles.css`.

**Step 3: Write README**

Create `README.md` with:
- Package name, one-line description
- Install command
- Quick usage example (batteries-included)
- Compound components example
- usePdfViewer hook example
- Props table
- Theming/CSS custom properties
- License (MIT)

**Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage examples and API docs"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Project scaffolding (package.json, tsconfig, tsup, vitest) |
| 2 | Types & constants |
| 3 | usePdfDocument hook (PDF loading) |
| 4 | PdfViewerProvider (context + state) |
| 5 | Page component (canvas + text layer) |
| 6 | Pages container (virtualized scroll) |
| 7 | Toolbar, Navigation, Zoom, Rotate, Separator |
| 8 | Download, Print, FullScreen, ThumbnailToggle |
| 9 | Search component |
| 10 | ThumbnailSidebar |
| 11 | Root compound component |
| 12 | Batteries-included PdfViewer |
| 13 | usePdfViewer public hook |
| 14 | CSS styles (light/dark theme) |
| 15 | Package exports & index |
| 16 | Keyboard shortcuts |
| 17 | Demo app |
| 18 | Final build verification & README |
