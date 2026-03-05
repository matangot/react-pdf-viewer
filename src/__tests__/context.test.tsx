import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PdfViewerProvider, usePdfViewerContext } from '../context';

// Mock the usePdfDocument hook
vi.mock('../hooks/use-pdf-document', () => ({
  usePdfDocument: vi.fn().mockReturnValue({
    document: {
      numPages: 10,
      getPage: vi.fn(),
      getData: vi.fn().mockResolvedValue(new Uint8Array([1])),
      destroy: vi.fn(),
    },
    isLoading: false,
    error: null,
  }),
}));

function TestConsumer() {
  const ctx = usePdfViewerContext();
  return (
    <div>
      <span data-testid="page">{ctx.currentPage}</span>
      <span data-testid="total">{ctx.totalPages}</span>
      <span data-testid="zoom">{ctx.zoomLevel}</span>
      <span data-testid="rotation">{ctx.rotation}</span>
      <button onClick={ctx.nextPage}>next</button>
      <button onClick={ctx.prevPage}>prev</button>
      <button onClick={ctx.zoomIn}>zoomIn</button>
      <button onClick={ctx.zoomOut}>zoomOut</button>
      <button onClick={() => ctx.rotate()}>rotate</button>
    </div>
  );
}

describe('PdfViewerProvider', () => {
  it('provides initial state', () => {
    render(
      <PdfViewerProvider src="test.pdf">
        <TestConsumer />
      </PdfViewerProvider>
    );

    expect(screen.getByTestId('page').textContent).toBe('1');
    expect(screen.getByTestId('total').textContent).toBe('10');
    expect(screen.getByTestId('zoom').textContent).toBe('1');
    expect(screen.getByTestId('rotation').textContent).toBe('0');
  });

  it('navigates pages', () => {
    render(
      <PdfViewerProvider src="test.pdf">
        <TestConsumer />
      </PdfViewerProvider>
    );

    act(() => screen.getByText('next').click());
    expect(screen.getByTestId('page').textContent).toBe('2');

    act(() => screen.getByText('prev').click());
    expect(screen.getByTestId('page').textContent).toBe('1');

    // Should not go below 1
    act(() => screen.getByText('prev').click());
    expect(screen.getByTestId('page').textContent).toBe('1');
  });

  it('zooms in and out', () => {
    render(
      <PdfViewerProvider src="test.pdf">
        <TestConsumer />
      </PdfViewerProvider>
    );

    act(() => screen.getByText('zoomIn').click());
    expect(screen.getByTestId('zoom').textContent).toBe('1.25');

    act(() => screen.getByText('zoomOut').click());
    expect(screen.getByTestId('zoom').textContent).toBe('1');
  });

  it('rotates by 90 degrees', () => {
    render(
      <PdfViewerProvider src="test.pdf">
        <TestConsumer />
      </PdfViewerProvider>
    );

    act(() => screen.getByText('rotate').click());
    expect(screen.getByTestId('rotation').textContent).toBe('90');
  });
});
