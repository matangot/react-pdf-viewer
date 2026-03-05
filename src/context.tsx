import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { usePdfDocument } from './hooks/use-pdf-document';
import { DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from './constants';
import type {
  PdfSource,
  PdfViewerContextValue,
  ZoomMode,
  ZoomValue,
  SearchMatch,
  DocumentInfo,
} from './types';

const PdfViewerContext = createContext<PdfViewerContextValue | null>(null);

export function usePdfViewerContext(): PdfViewerContextValue {
  const ctx = useContext(PdfViewerContext);
  if (!ctx) {
    throw new Error(
      'usePdfViewerContext must be used within a PdfViewerProvider'
    );
  }
  return ctx;
}

export interface PdfViewerProviderProps {
  src: PdfSource;
  defaultPage?: number;
  defaultZoom?: ZoomValue;
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

  const containerRef = useRef<HTMLElement | null>(null);

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

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
      onPageChange?.(clamped);
    },
    [totalPages, onPageChange]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    setZoomMode(null);
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    setZoomMode(null);
  }, []);

  const zoomTo = useCallback((value: ZoomValue) => {
    if (typeof value === 'number') {
      setZoomLevel(Math.max(MIN_ZOOM, Math.min(value, MAX_ZOOM)));
      setZoomMode(null);
    } else {
      setZoomMode(value);
    }
  }, []);

  // Internal: set zoom level without clearing zoomMode (used by fit-zoom computation)
  const _setZoomLevel = useCallback((level: number) => {
    setZoomLevel(Math.max(MIN_ZOOM, Math.min(level, MAX_ZOOM)));
  }, []);

  const rotate = useCallback((degrees: number = 90) => {
    setRotation((prev) => (prev + degrees) % 360);
  }, []);

  const toggleThumbnails = useCallback(() => {
    setIsThumbnailsOpen((prev) => !prev);
  }, []);

  const search = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query || !document) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const matches: SearchMatch[] = [];
    const lowerQuery = query.toLowerCase();

    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .toLowerCase();

      let startIndex = 0;
      let matchIdx = 0;
      while ((startIndex = pageText.indexOf(lowerQuery, startIndex)) !== -1) {
        matches.push({ pageIndex: i - 1, matchIndex: matchIdx++ });
        startIndex += lowerQuery.length;
      }
    }

    setSearchMatches(matches);
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
  }, [document]);

  const navigateToMatch = useCallback((matchIndex: number) => {
    if (matchIndex < 0 || matchIndex >= searchMatches.length) return;
    const match = searchMatches[matchIndex];
    // Navigate to the page containing this match (pageIndex is 0-based)
    goToPage(match.pageIndex + 1);
  }, [searchMatches, goToPage]);

  const nextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const next = (prev + 1) % searchMatches.length;
      navigateToMatch(next);
      return next;
    });
  }, [searchMatches.length, navigateToMatch]);

  const prevMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const next = (prev - 1 + searchMatches.length) % searchMatches.length;
      navigateToMatch(next);
      return next;
    });
  }, [searchMatches.length, navigateToMatch]);

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
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [document]
  );

  const print = useCallback(() => {
    window.print();
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!window.document.fullscreenElement) {
      window.document.documentElement.requestFullscreen?.();
    } else {
      window.document.exitFullscreen?.();
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
      containerRef,
      goToPage,
      nextPage,
      prevPage,
      zoomIn,
      zoomOut,
      zoomTo,
      _setZoomLevel,
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
      _setZoomLevel,
      rotate,
      toggleThumbnails,
      search,
      nextMatch,
      prevMatch,
      clearSearch,
      download,
      print,
      toggleFullScreen,
    ]
  );

  return (
    <PdfViewerContext.Provider value={value}>
      {children}
    </PdfViewerContext.Provider>
  );
}
