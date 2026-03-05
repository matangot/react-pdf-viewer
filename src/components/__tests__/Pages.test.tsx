import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pages } from '../Pages';

const mockGoToPage = vi.fn();

vi.mock('../../context', () => ({
  usePdfViewerContext: () => ({
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
    _setCurrentPage: vi.fn(),
  }),
}));

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation(() => ({
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn(),
    }))
  );
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

  it('renders placeholders for distant pages', () => {
    const { container } = render(<Pages />);
    const placeholders = container.querySelectorAll(
      '.pdf-viewer__page-placeholder'
    );
    // Pages beyond VIRTUALIZATION_BUFFER (2) from visible page (1) should be placeholders
    // Visible: page 1. Buffer=2, so pages 1-3 render, pages 4-5 are placeholders
    expect(placeholders.length).toBeGreaterThan(0);
  });
});
