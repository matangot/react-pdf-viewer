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
  CursorMode,
  ViewMode,
  ScrollMode,
  LayoutMode,
  SearchMatch,
  DocumentInfo,
  DocumentProperties,
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
  defaultCursorMode?: CursorMode;
  defaultSidebarOpen?: boolean;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (info: DocumentInfo) => void;
  children: ReactNode;
}

export function PdfViewerProvider({
  src,
  defaultPage = 1,
  defaultZoom = DEFAULT_ZOOM,
  defaultCursorMode = 'select',
  defaultSidebarOpen = false,
  onPageChange,
  onDocumentLoad,
  children,
}: PdfViewerProviderProps) {
  const { document, isLoading, error } = usePdfDocument(src, onDocumentLoad);

  const totalPages = document?.numPages ?? 0;

  const containerRef = useRef<HTMLElement | null>(null);
  const scrollToPageRef = useRef<((page: number) => void) | null>(null);

  const [currentPage, setCurrentPage] = useState(defaultPage);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
  const [zoomLevel, setZoomLevel] = useState(
    typeof defaultZoom === 'number' ? defaultZoom : DEFAULT_ZOOM
  );
  const [zoomMode, setZoomMode] = useState<ZoomMode | null>(
    typeof defaultZoom === 'string' ? defaultZoom : (isMobile ? 'fit-width' : null)
  );
  const [rotation, setRotation] = useState(0);
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState(defaultSidebarOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [cursorMode, setCursorModeState] = useState<CursorMode>(defaultCursorMode);
  const [viewMode, setViewModeState] = useState<ViewMode>('single');
  const [scrollMode, setScrollModeState] = useState<ScrollMode>('vertical');
  const [isDocPropertiesOpen, setIsDocPropertiesOpen] = useState(false);
  const [docProperties, setDocProperties] = useState<DocumentProperties | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const currentPageRef = useRef(defaultPage);

  // Internal: just update the page state (used by scroll tracking)
  const _setCurrentPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      if (currentPageRef.current === clamped) return;
      currentPageRef.current = clamped;
      setCurrentPage(clamped);
      onPageChange?.(clamped);
    },
    [totalPages, onPageChange]
  );

  // Public: navigate to page AND scroll to it
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      currentPageRef.current = clamped;
      setCurrentPage(clamped);
      onPageChange?.(clamped);
      // Scroll to the page (the ref is set by Pages component)
      scrollToPageRef.current?.(clamped);
    },
    [totalPages, onPageChange]
  );

  // Stable references — don't depend on currentPage
  const nextPage = useCallback(() => {
    goToPage(currentPageRef.current + 1);
  }, [goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPageRef.current - 1);
  }, [goToPage]);

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
    // Scroll the highlighted element into view after render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = containerRef?.current?.querySelector('.pdf-viewer__search-hit--current');
        el?.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
    });
  }, [searchMatches, goToPage, containerRef]);

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

  const print = useCallback(async () => {
    if (!document) return;
    const total = document.numPages;

    // Set isPrinting to force all pages to render
    setIsPrinting(true);

    // Wait for all pages to finish rendering their canvases
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        const container = containerRef.current;
        if (!container) return;
        const canvases = container.querySelectorAll('.pdf-viewer__page-canvas');
        let rendered = 0;
        canvases.forEach((c) => {
          const canvas = c as HTMLCanvasElement;
          if (canvas.width > 0 && canvas.height > 0) rendered++;
        });
        if (rendered >= total) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Safety timeout after 10s
      setTimeout(() => { clearInterval(checkInterval); resolve(); }, 10000);
    });

    // Print via hidden iframe to bypass host page layout constraints
    const container = containerRef.current;
    if (!container) { setIsPrinting(false); return; }

    const canvases = Array.from(container.querySelectorAll('.pdf-viewer__page-canvas')) as HTMLCanvasElement[];
    const iframe = window.document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    window.document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) { setIsPrinting(false); return; }

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html><html><head><style>
      * { margin: 0; padding: 0; }
      body { background: white; }
      img { display: block; width: 100%; height: auto; page-break-after: always; }
      img:last-child { page-break-after: auto; }
    </style></head><body></body></html>`);
    iframeDoc.close();

    // Convert each canvas to an image in the iframe
    for (const canvas of canvases) {
      const img = iframeDoc.createElement('img');
      img.src = canvas.toDataURL('image/png');
      iframeDoc.body.appendChild(img);
    }

    // Wait for images to load, then print
    await new Promise<void>((resolve) => {
      const imgs = iframeDoc.querySelectorAll('img');
      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded >= imgs.length) resolve();
      };
      imgs.forEach((img) => {
        if (img.complete) { loaded++; } else { img.onload = onLoad; }
      });
      if (loaded >= imgs.length) resolve();
    });

    iframe.contentWindow?.print();

    // Cleanup after print dialog closes
    setTimeout(() => {
      window.document.body.removeChild(iframe);
      setIsPrinting(false);
    }, 500);
  }, [document]);

  const setCursorMode = useCallback((mode: CursorMode) => {
    setCursorModeState(mode);
  }, []);

  const toggleCursorMode = useCallback(() => {
    setCursorModeState((prev) => (prev === 'select' ? 'hand' : 'select'));
  }, []);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    // Dual page is not allowed with horizontal scrolling
    if (mode === 'dual') {
      setScrollModeState((prev) => prev === 'horizontal' ? 'vertical' : prev);
    }
  }, []);

  const setScrollMode = useCallback((mode: ScrollMode) => {
    setScrollModeState(mode);
    // Horizontal scrolling is not allowed with dual page
    if (mode === 'horizontal') {
      setViewModeState('single');
    }
  }, []);

  // Derive layoutMode for backward compatibility
  const layoutMode: LayoutMode = scrollMode === 'horizontal' ? 'horizontal' : viewMode === 'dual' ? 'dual' : 'single';

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    if (mode === 'horizontal') {
      setScrollModeState('horizontal');
      setViewModeState('single');
    } else if (mode === 'dual') {
      setViewModeState('dual');
      setScrollModeState((prev) => prev === 'horizontal' ? 'vertical' : prev);
    } else {
      setViewModeState('single');
    }
  }, []);

  const openDocProperties = useCallback(async () => {
    if (!document) return;
    try {
      const metadata = await document.getMetadata();
      const info = (metadata?.info as Record<string, any>) ?? {};
      const page = await document.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const widthIn = (viewport.width / 72).toFixed(1);
      const heightIn = (viewport.height / 72).toFixed(1);
      const widthMm = (viewport.width / 72 * 25.4).toFixed(0);
      const heightMm = (viewport.height / 72 * 25.4).toFixed(0);

      const formatDate = (raw: string | undefined) => {
        if (!raw) return '-';
        // PDF dates: D:YYYYMMDDHHmmSS
        const match = raw.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
        if (match) {
          const [, y, m, d, h, min, s] = match;
          return new Date(`${y}-${m}-${d}T${h}:${min}:${s}`).toLocaleString();
        }
        return raw;
      };

      const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      };

      const data = await document.getData();

      let fileName = '-';
      if (typeof src === 'string') {
        const urlPath = src.split('?')[0].split('#')[0];
        const lastSegment = urlPath.split('/').pop();
        if (lastSegment) fileName = decodeURIComponent(lastSegment);
      } else if (src instanceof File) {
        fileName = src.name;
      }

      setDocProperties({
        fileName,
        fileSize: formatFileSize(data.byteLength),
        title: info.Title || '-',
        author: info.Author || '-',
        subject: info.Subject || '-',
        creator: info.Creator || '-',
        producer: info.Producer || '-',
        creationDate: formatDate(info.CreationDate),
        modificationDate: formatDate(info.ModDate),
        pageCount: document.numPages,
        pageSize: `${widthIn} × ${heightIn} in (${widthMm} × ${heightMm} mm)`,
      });
      setIsDocPropertiesOpen(true);
    } catch {
      // ignore metadata errors
    }
  }, [document, src]);

  const closeDocProperties = useCallback(() => {
    setIsDocPropertiesOpen(false);
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!window.document.fullscreenElement) {
      // Fullscreen the viewer container, fall back to documentElement
      const el = containerRef.current?.closest('.pdf-viewer') ?? window.document.documentElement;
      (el as HTMLElement).requestFullscreen?.();
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
      isPrinting,
      containerRef,
      scrollToPageRef,
      _setCurrentPage,
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
      cursorMode,
      setCursorMode,
      toggleCursorMode,
      viewMode,
      scrollMode,
      layoutMode,
      setViewMode,
      setScrollMode,
      setLayoutMode,
      isDocPropertiesOpen,
      docProperties,
      goToFirstPage,
      goToLastPage,
      openDocProperties,
      closeDocProperties,
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
      isPrinting,
      _setCurrentPage,
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
      cursorMode,
      setCursorMode,
      toggleCursorMode,
      viewMode,
      scrollMode,
      layoutMode,
      setViewMode,
      setScrollMode,
      setLayoutMode,
      isDocPropertiesOpen,
      docProperties,
      goToFirstPage,
      goToLastPage,
      openDocProperties,
      closeDocProperties,
    ]
  );

  return (
    <PdfViewerContext.Provider value={value}>
      {children}
    </PdfViewerContext.Provider>
  );
}
