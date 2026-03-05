import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Page } from '../Page';

vi.mock('../../context', () => ({
  usePdfViewerContext: () => ({
    document: null,
    isLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 10,
    zoomLevel: 1,
    zoomMode: null,
    rotation: 0,
    isThumbnailsOpen: false,
    searchQuery: '',
    searchMatches: [],
    currentMatchIndex: -1,
    goToPage: vi.fn(),
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

describe('Page', () => {
  it('renders wrapper with data-page-number', () => {
    const { container } = render(<Page pageNumber={3} />);
    const wrapper = container.querySelector('[data-page-number="3"]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('pdf-viewer__page');
  });

  it('contains a canvas', () => {
    const { container } = render(<Page pageNumber={1} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('pdf-viewer__page-canvas');
  });
});
