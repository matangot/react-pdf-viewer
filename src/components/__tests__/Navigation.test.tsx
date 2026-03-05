import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navigation } from '../Navigation';

const mockContext = {
  document: null,
  isLoading: false,
  error: null,
  currentPage: 3,
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
};

vi.mock('../../context', () => ({
  usePdfViewerContext: () => mockContext,
}));

describe('Navigation', () => {
  it('displays "of 10"', () => {
    render(<Navigation />);
    expect(screen.getByText('of 10')).toBeInTheDocument();
  });

  it('prev button calls prevPage', () => {
    render(<Navigation />);
    fireEvent.click(screen.getByLabelText('Previous page'));
    expect(mockContext.prevPage).toHaveBeenCalled();
  });

  it('next button calls nextPage', () => {
    render(<Navigation />);
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(mockContext.nextPage).toHaveBeenCalled();
  });
});
