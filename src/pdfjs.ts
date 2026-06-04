import type * as Pdfjs from 'pdfjs-dist';

let modulePromise: Promise<typeof Pdfjs> | null = null;

/**
 * Load pdf.js lazily and memoize it. A static import crashes server-side
 * rendering because pdf.js touches browser globals (DOMMatrix, etc.) at module
 * load; deferring it keeps importing this library SSR-safe. The promise is
 * cached, so it's a one-time cost — not a per-render dynamic import.
 */
export function loadPdfjs(): Promise<typeof Pdfjs> {
  if (!modulePromise) {
    modulePromise = import('pdfjs-dist');
  }
  return modulePromise;
}
