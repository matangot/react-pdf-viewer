import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePdfDocument } from '../use-pdf-document';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}));

import { getDocument } from 'pdfjs-dist';

const mockDoc = {
  numPages: 5,
  getMetadata: vi.fn().mockResolvedValue({
    info: { Title: 'Test', Author: 'Author' },
  }),
  getPage: vi.fn(),
  getData: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  destroy: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
    promise: Promise.resolve(mockDoc),
  });
});

describe('usePdfDocument', () => {
  it('loads a PDF from a URL string', async () => {
    const onLoad = vi.fn();
    const { result } = renderHook(() =>
      usePdfDocument('https://example.com/test.pdf', onLoad)
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.document).toBe(mockDoc);
    expect(result.current.error).toBeNull();
    expect(onLoad).toHaveBeenCalledWith({
      numPages: 5,
      title: 'Test',
      author: 'Author',
    });
  });

  it('sets error state on load failure', async () => {
    (getDocument as ReturnType<typeof vi.fn>).mockReturnValue({
      promise: Promise.reject(new Error('Load failed')),
    });

    const { result } = renderHook(() => usePdfDocument('bad-url'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.document).toBeNull();
    expect(result.current.error?.message).toBe('Load failed');
  });

  it('accepts a Uint8Array source', async () => {
    const data = new Uint8Array([1, 2, 3]);
    const { result } = renderHook(() => usePdfDocument(data));

    await waitFor(() => {
      expect(result.current.document).toBe(mockDoc);
    });

    expect(getDocument).toHaveBeenCalledWith({ data });
  });
});
