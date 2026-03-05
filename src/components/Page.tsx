import { useEffect, useRef, useCallback } from 'react';
import { usePdfViewerContext } from '../context';

export interface PageProps {
  pageNumber: number;
  className?: string;
}

export function Page({ pageNumber, className }: PageProps) {
  const { document, zoomLevel, rotation, searchQuery, searchMatches, currentMatchIndex } = usePdfViewerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const applyHighlightsRef = useRef<(() => void) | null>(null);

  const renderPage = useCallback(async () => {
    if (!document || !canvasRef.current) return;

    // Cancel any previous render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    try {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: zoomLevel, rotation });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.scale(dpr, dpr);

      const renderTask = page.render({
        canvasContext: context,
        viewport,
      });

      renderTaskRef.current = renderTask;

      await renderTask.promise;

      // Render text layer
      if (textLayerRef.current) {
        const textLayer = textLayerRef.current;
        textLayer.innerHTML = '';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;

        const textContent = await page.getTextContent();
        const pdfjs = await import('pdfjs-dist') as any;

        if (pdfjs.renderTextLayer) {
          const textRenderTask = pdfjs.renderTextLayer({
            textContentSource: textContent,
            container: textLayer,
            viewport,
          });
          await textRenderTask.promise;
          // Re-apply search highlights after text layer is ready
          requestAnimationFrame(() => applyHighlightsRef.current?.());
        }
      }
    } catch (err: unknown) {
      // Ignore cancelled render errors
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') return;
    }
  }, [document, pageNumber, zoomLevel, rotation]);

  // Highlight search matches by adding classes directly to text layer spans
  const applyHighlights = useCallback(() => {
    const textLayer = textLayerRef.current;
    if (!textLayer) return;

    // Clear previous highlights
    textLayer.querySelectorAll('.pdf-viewer__search-hit').forEach((el) => {
      el.classList.remove('pdf-viewer__search-hit', 'pdf-viewer__search-hit--current');
    });

    if (!searchQuery || searchMatches.length === 0) return;

    const pageMatches = searchMatches.filter((m) => m.pageIndex === pageNumber - 1);
    if (pageMatches.length === 0) return;

    const lowerQuery = searchQuery.toLowerCase();
    const spans = Array.from(textLayer.querySelectorAll('span'));

    let pageMatchIdx = 0;
    for (const span of spans) {
      const spanText = (span.textContent || '').toLowerCase();
      if (spanText.includes(lowerQuery)) {
        span.classList.add('pdf-viewer__search-hit');

        // Check if this is the current active match
        if (pageMatchIdx < pageMatches.length) {
          const globalIdx = searchMatches.indexOf(pageMatches[pageMatchIdx]);
          if (globalIdx === currentMatchIndex) {
            span.classList.add('pdf-viewer__search-hit--current');
          }
        }
        pageMatchIdx++;
      }
    }
  }, [searchQuery, searchMatches, currentMatchIndex, pageNumber]);

  // Keep ref in sync for use by renderPage callback
  applyHighlightsRef.current = applyHighlights;

  // Re-apply highlights when search state changes
  useEffect(() => {
    applyHighlights();
  }, [applyHighlights]);

  useEffect(() => {
    renderPage();
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [renderPage]);

  const classNames = ['pdf-viewer__page', className].filter(Boolean).join(' ');

  return (
    <div className={classNames} data-page-number={pageNumber}>
      <canvas ref={canvasRef} className="pdf-viewer__page-canvas" />
      <div ref={textLayerRef} className="pdf-viewer__page-text-layer" />
    </div>
  );
}
