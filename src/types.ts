import type React from 'react';

export type PdfSource = string | File | ArrayBuffer | Uint8Array;

export type ZoomMode = 'fit-width' | 'fit-page';
export type ZoomValue = number | ZoomMode;
export type Theme = 'light' | 'dark' | 'system';
export type CursorMode = 'select' | 'hand';
export type ViewMode = 'single' | 'dual';
export type ScrollMode = 'page' | 'vertical' | 'horizontal';
/** @deprecated Use ViewMode and ScrollMode instead */
export type LayoutMode = 'single' | 'dual' | 'horizontal';

export interface DocumentInfo {
  numPages: number;
  title?: string;
  author?: string;
}

export interface DocumentProperties {
  fileName: string;
  fileSize: string;
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  pageCount: number;
  pageSize: string;
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
  cursorMode: CursorMode;
  viewMode: ViewMode;
  scrollMode: ScrollMode;
  layoutMode: LayoutMode;
  isDocPropertiesOpen: boolean;
  docProperties: DocumentProperties | null;
  isPrinting: boolean;
}

export interface PdfViewerActions {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (value: ZoomValue) => void;
  /** @internal Set zoom level without clearing zoomMode (used by fit-zoom computation) */
  _setZoomLevel: (level: number) => void;
  /** @internal Set current page without scrolling (used by scroll tracking) */
  _setCurrentPage: (page: number) => void;
  rotate: (degrees?: number) => void;
  toggleThumbnails: () => void;
  search: (query: string) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  clearSearch: () => void;
  download: (fileName?: string) => void;
  print: () => void;
  toggleFullScreen: () => void;
  setCursorMode: (mode: CursorMode) => void;
  toggleCursorMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  setScrollMode: (mode: ScrollMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  openDocProperties: () => void;
  closeDocProperties: () => void;
  /** @internal Ref to the pages container element for fit-zoom calculations */
  containerRef: React.MutableRefObject<HTMLElement | null>;
  /** @internal Ref to scroll-to-page function set by Pages component */
  scrollToPageRef: React.MutableRefObject<((page: number) => void) | null>;
}

export type PdfViewerContextValue = PdfViewerState & PdfViewerActions;

export interface PdfViewerRootProps {
  src: PdfSource;
  defaultPage?: number;
  defaultZoom?: ZoomValue;
  defaultCursorMode?: CursorMode;
  defaultSidebarOpen?: boolean;
  theme?: Theme;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (info: DocumentInfo) => void;
  className?: string;
  children: React.ReactNode;
}

export interface PdfViewerProps extends Omit<PdfViewerRootProps, 'children'> {
  // Batteries-included: no children needed
}
