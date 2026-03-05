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
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (src === prevSrcRef.current) return;
    prevSrcRef.current = src;

    // Revoke previous object URL if any
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const init = getDocumentInit(src);
    if (src instanceof File) {
      objectUrlRef.current = init.url as string;
    }

    const loadingTask = getDocument(init);

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
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
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
