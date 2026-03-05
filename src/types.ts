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
