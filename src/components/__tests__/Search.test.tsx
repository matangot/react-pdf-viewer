import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Search } from '../Search';

const mockContext = {
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

function openSearchPanel() {
  render(<Search />);
  fireEvent.click(screen.getByLabelText('Search in document'));
}

describe('Search', () => {
  it('renders input with placeholder after opening', () => {
    openSearchPanel();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('calls search on change', () => {
    openSearchPanel();
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'hello' },
    });
    expect(mockContext.search).toHaveBeenCalledWith('hello');
  });

  it('calls nextMatch on Enter', () => {
    openSearchPanel();
    fireEvent.keyDown(screen.getByPlaceholderText('Search...'), {
      key: 'Enter',
    });
    expect(mockContext.nextMatch).toHaveBeenCalled();
  });

  it('anchors the panel to the right when it would overflow the viewer right edge', () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const base = { top: 0, bottom: 0, y: 0, height: 0, toJSON: () => {} };
        if (this.classList.contains('pdf-viewer')) {
          return { ...base, left: 0, right: 600, x: 0, width: 600 } as DOMRect;
        }
        if (this.classList.contains('pdf-viewer__search-panel')) {
          // Left-anchored panel extends past the viewer's right edge (600)
          return { ...base, left: 500, right: 800, x: 500, width: 300 } as DOMRect;
        }
        return { ...base, left: 0, right: 0, x: 0, width: 0 } as DOMRect;
      });

    const { container } = render(
      <div className="pdf-viewer">
        <Search />
      </div>
    );
    fireEvent.click(screen.getByLabelText('Search in document'));

    const panel = container.querySelector('.pdf-viewer__search-panel');
    expect(panel).toHaveClass('pdf-viewer__search-panel--align-right');

    rectSpy.mockRestore();
  });

  it('keeps the panel left-anchored when it fits within the viewer', () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const base = { top: 0, bottom: 0, y: 0, height: 0, toJSON: () => {} };
        if (this.classList.contains('pdf-viewer')) {
          return { ...base, left: 0, right: 600, x: 0, width: 600 } as DOMRect;
        }
        if (this.classList.contains('pdf-viewer__search-panel')) {
          return { ...base, left: 0, right: 300, x: 0, width: 300 } as DOMRect;
        }
        return { ...base, left: 0, right: 0, x: 0, width: 0 } as DOMRect;
      });

    const { container } = render(
      <div className="pdf-viewer">
        <Search />
      </div>
    );
    fireEvent.click(screen.getByLabelText('Search in document'));

    const panel = container.querySelector('.pdf-viewer__search-panel');
    expect(panel).toHaveClass('pdf-viewer__search-panel--align-left');

    rectSpy.mockRestore();
  });
});
