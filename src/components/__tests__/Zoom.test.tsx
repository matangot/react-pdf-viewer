import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Zoom } from '../Zoom';

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

describe('Zoom', () => {
  it('displays "100%"', () => {
    render(<Zoom />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('zoom in calls zoomIn', () => {
    render(<Zoom />);
    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(mockContext.zoomIn).toHaveBeenCalled();
  });

  it('zoom out calls zoomOut', () => {
    render(<Zoom />);
    fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(mockContext.zoomOut).toHaveBeenCalled();
  });
});
