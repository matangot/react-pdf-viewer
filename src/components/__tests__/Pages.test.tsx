import { render, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pages } from '../Pages';

const mockSetCurrentPage = vi.fn();
const mockGoToPage = vi.fn();

const mockContext = {
  document: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 5,
  zoomLevel: 1,
  zoomMode: null,
  rotation: 0,
  isThumbnailsOpen: false,
  searchQuery: '',
  searchMatches: [],
  currentMatchIndex: -1,
  goToPage: mockGoToPage,
  nextPage: vi.fn(),
  prevPage: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  zoomTo: vi.fn(),
  _setZoomLevel: vi.fn(),
  rotate: vi.fn(),
  toggleThumbnails: vi.fn(),
  search: vi.fn(),
  nextMatch: vi.fn(),
  prevMatch: vi.fn(),
  clearSearch: vi.fn(),
  download: vi.fn(),
  print: vi.fn(),
  toggleFullScreen: vi.fn(),
  containerRef: { current: null },
  scrollToPageRef: { current: null },
  _setCurrentPage: mockSetCurrentPage,
  cursorMode: 'select' as const,
  setCursorMode: vi.fn(),
  toggleCursorMode: vi.fn(),
  viewMode: 'single' as const,
  scrollMode: 'vertical' as const,
  layoutMode: 'single' as const,
  setViewMode: vi.fn(),
  setScrollMode: vi.fn(),
  setLayoutMode: vi.fn(),
  isDocPropertiesOpen: false,
  docProperties: null,
  isPrinting: false,
  goToFirstPage: vi.fn(),
  goToLastPage: vi.fn(),
  openDocProperties: vi.fn(),
  closeDocProperties: vi.fn(),
};

vi.mock('../../context', () => ({
  usePdfViewerContext: () => mockContext,
}));

beforeEach(() => {
  mockSetCurrentPage.mockClear();
});

describe('Pages', () => {
  it('renders scroll container', () => {
    const { container } = render(<Pages />);
    const scrollContainer = container.querySelector('.pdf-viewer__pages');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('renders page wrappers for all pages', () => {
    const { container } = render(<Pages />);
    const wrappers = container.querySelectorAll('.pdf-viewer__page-wrapper');
    expect(wrappers).toHaveLength(5);
  });

  it('renders placeholders for distant pages in page scroll mode', () => {
    const origTotal = mockContext.totalPages;
    const origScroll = mockContext.scrollMode;
    // In page scroll mode, virtualization uses currentPage distance instead of
    // getBoundingClientRect, so it works reliably in jsdom.
    mockContext.totalPages = 10;
    mockContext.scrollMode = 'page' as const;

    const { container } = render(<Pages />);
    const placeholders = container.querySelectorAll('.pdf-viewer__page-placeholder');
    // currentPage=1, VIRTUALIZATION_BUFFER=2 → pages 1-3 render, pages 4-10 are placeholders
    expect(placeholders.length).toBeGreaterThan(0);

    mockContext.totalPages = origTotal;
    mockContext.scrollMode = origScroll;
  });

  describe('current page detection', () => {
    // Helper: mock getBoundingClientRect for the container and page wrappers
    // to simulate a scroll position where a given page has the most viewport overlap.
    function mockScrollPosition(
      container: HTMLElement,
      pageRects: Record<number, { top: number; bottom: number }>
    ) {
      const containerRect = { top: 0, bottom: 600, left: 0, right: 800, width: 800, height: 600, x: 0, y: 0, toJSON: () => ({}) };
      container.getBoundingClientRect = () => containerRect as DOMRect;

      const wrappers = container.querySelectorAll<HTMLElement>('.pdf-viewer__page-wrapper[data-page-number]');
      for (const el of wrappers) {
        const pageNum = Number(el.dataset.pageNumber);
        const rect = pageRects[pageNum];
        if (rect) {
          el.getBoundingClientRect = () => ({
            top: rect.top, bottom: rect.bottom,
            left: 0, right: 800, width: 800, height: rect.bottom - rect.top,
            x: 0, y: rect.top, toJSON: () => ({}),
          } as DOMRect);
        }
      }
    }

    async function flushRAFs() {
      // The scroll handler uses two nested rAFs: onScroll → rAF(updateVisibility) → rAF(updateCurrentPage)
      // Advance fake timers enough for both to fire.
      await act(async () => {
        vi.advanceTimersByTime(50);
      });
      await act(async () => {
        vi.advanceTimersByTime(50);
      });
    }

    it('reports page with most viewport overlap as current page', async () => {
      vi.useFakeTimers();
      const { container } = render(<Pages />);
      const scrollContainer = container.querySelector('.pdf-viewer__pages') as HTMLElement;

      // Simulate: page 2 has most overlap (400px), page 1 has less (100px)
      mockScrollPosition(scrollContainer, {
        1: { top: -700, bottom: 100 },
        2: { top: 100, bottom: 900 },  // 500px overlap with 0..600 viewport
        3: { top: 900, bottom: 1700 },
        4: { top: 1700, bottom: 2500 },
        5: { top: 2500, bottom: 3300 },
      });

      fireEvent.scroll(scrollContainer);
      await flushRAFs();

      expect(mockSetCurrentPage).toHaveBeenCalledWith(2);
      vi.useRealTimers();
    });

    it('reports last page as current when scrolled to bottom', async () => {
      vi.useFakeTimers();
      const { container } = render(<Pages />);
      const scrollContainer = container.querySelector('.pdf-viewer__pages') as HTMLElement;

      // Simulate scrolled to bottom: last page has partial overlap,
      // but its top is below the viewport midpoint (the old bug scenario).
      mockScrollPosition(scrollContainer, {
        1: { top: -3600, bottom: -2800 },
        2: { top: -2800, bottom: -2000 },
        3: { top: -2000, bottom: -1200 },
        4: { top: -1200, bottom: -400 },
        5: { top: -400, bottom: 400 },  // 400px overlap — most overlap
      });

      fireEvent.scroll(scrollContainer);
      await flushRAFs();

      expect(mockSetCurrentPage).toHaveBeenCalledWith(5);
      vi.useRealTimers();
    });

    it('reports last page when its top is below viewport midpoint', async () => {
      vi.useFakeTimers();
      const { container } = render(<Pages />);
      const scrollContainer = container.querySelector('.pdf-viewer__pages') as HTMLElement;

      // Edge case: last page top is at 350 (below midpoint 300),
      // but it still has the most overlap in the viewport.
      mockScrollPosition(scrollContainer, {
        1: { top: -3800, bottom: -3000 },
        2: { top: -3000, bottom: -2200 },
        3: { top: -2200, bottom: -1400 },
        4: { top: -1400, bottom: -200 },
        5: { top: 350, bottom: 1150 },  // 250px overlap (350..600), only visible page
      });

      fireEvent.scroll(scrollContainer);
      await flushRAFs();

      expect(mockSetCurrentPage).toHaveBeenCalledWith(5);
      vi.useRealTimers();
    });

    it('preserves navigate target when target page is visible (last page nav)', async () => {
      vi.useFakeTimers();
      const { container } = render(<Pages />);
      const scrollContainer = container.querySelector('.pdf-viewer__pages') as HTMLElement;
      // jsdom doesn't implement scrollTo
      scrollContainer.scrollTo = vi.fn() as any;

      // The scrollToPage function is exposed via scrollToPageRef.
      const scrollToPage = mockContext.scrollToPageRef.current;
      expect(scrollToPage).not.toBeNull();

      // Mock rects so page 5 wrapper is found and has a position
      mockScrollPosition(scrollContainer, {
        1: { top: -1600, bottom: -800 },
        2: { top: -800, bottom: 0 },
        3: { top: 0, bottom: 800 },
        4: { top: 400, bottom: 1200 },
        5: { top: 200, bottom: 1000 },
      });

      // Simulate what goToPage does: set the target and scroll
      scrollToPage!(5);

      // After navigation settles (150ms fallback timer)
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Now simulate the scroll position after scrollTo (clamped at bottom):
      // pages 3-5 visible, page 3 has most overlap but target is page 5
      mockScrollPosition(scrollContainer, {
        1: { top: -1600, bottom: -800 },
        2: { top: -800, bottom: 0 },
        3: { top: 0, bottom: 600 },     // 600px overlap (fills viewport)
        4: { top: 200, bottom: 800 },   // 400px overlap
        5: { top: 400, bottom: 1000 },  // 200px overlap (within 200px buffer = visible)
      });

      mockSetCurrentPage.mockClear();
      fireEvent.scroll(scrollContainer);
      await flushRAFs();

      // Should NOT override to page 3 — navigate target (page 5) is preserved
      // because page 5 is still in the visible set (within 200px buffer).
      expect(mockSetCurrentPage).not.toHaveBeenCalledWith(3);
      vi.useRealTimers();
    });
  });
});
