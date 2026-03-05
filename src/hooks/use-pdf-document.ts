import { useState, useEffect, useRef } from 'react';
import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfSource, DocumentInfo } from '../types';

export function usePdfDocument(
  src: PdfSource,
  onDocumentLoad?: (info: DocumentInfo) => void
) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const prevSrcRef = useRef<PdfSource | null>(null);

  useEffect(() => {
    if (src === prevSrcRef.current) return;
    prevSrcRef.current = src;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const loadingTask = getDocument(getDocumentInit(src));

    loadingTask.promise
      .then(async (doc) => {
        if (cancelled) {
          doc.destroy();
          return;
        }
        setDocument(doc);
        setIsLoading(false);

        const metadata = await doc.getMetadata();
        const info = metadata.info as Record<string, string> | null;
        onDocumentLoad?.({
          numPages: doc.numPages,
          title: info?.Title,
          author: info?.Author,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return { document, isLoading, error };
}

function getDocumentInit(src: PdfSource) {
  if (typeof src === 'string') {
    return { url: src };
  }
  if (src instanceof File) {
    return { url: URL.createObjectURL(src) };
  }
  // ArrayBuffer or Uint8Array
  return { data: src };
}
