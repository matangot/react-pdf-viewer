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
};

vi.mock('../../context', () => ({
  usePdfViewerContext: () => mockContext,
}));

describe('Search', () => {
  it('renders input with placeholder', () => {
    render(<Search />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('calls search on change', () => {
    render(<Search />);
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'hello' },
    });
    expect(mockContext.search).toHaveBeenCalledWith('hello');
  });

  it('calls nextMatch on Enter', () => {
    render(<Search />);
    fireEvent.keyDown(screen.getByPlaceholderText('Search...'), {
      key: 'Enter',
    });
    expect(mockContext.nextMatch).toHaveBeenCalled();
  });
});
