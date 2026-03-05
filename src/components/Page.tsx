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
        }
      }
    } catch (err: unknown) {
      // Ignore cancelled render errors
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') return;
    }
  }, [document, pageNumber, zoomLevel, rotation]);

  // Highlight search matches in the text layer
  useEffect(() => {
    const textLayer = textLayerRef.current;
    if (!textLayer) return;

    // Clear previous highlights
    textLayer.querySelectorAll('.pdf-viewer__highlight').forEach((el) => el.remove());

    if (!searchQuery || searchMatches.length === 0) return;

    // Find matches on this page
    const pageMatches = searchMatches.filter((m) => m.pageIndex === pageNumber - 1);
    if (pageMatches.length === 0) return;

    // Walk text layer spans and highlight matching text
    const spans = Array.from(textLayer.querySelectorAll('span'));
    const fullText = spans.map((s) => s.textContent || '').join('');
    const lowerText = fullText.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();

    let searchStart = 0;
    let matchIdx = 0;
    while ((searchStart = lowerText.indexOf(lowerQuery, searchStart)) !== -1) {
      // Find which span(s) contain this match
      let charCount = 0;
      for (const span of spans) {
        const spanText = span.textContent || '';
        const spanStart = charCount;
        const spanEnd = charCount + spanText.length;

        if (spanEnd > searchStart && spanStart < searchStart + lowerQuery.length) {
          // This span contains part of the match
          const rect = span.getBoundingClientRect();
          const layerRect = textLayer.getBoundingClientRect();

          const highlight = window.document.createElement('div');
          highlight.className = 'pdf-viewer__highlight';

          // Check if this is the current match
          const globalMatchIndex = pageMatches.findIndex((m) => m.matchIndex === matchIdx);
          const isCurrentMatch = globalMatchIndex !== -1 &&
            searchMatches.indexOf(pageMatches[globalMatchIndex]) === currentMatchIndex;

          if (isCurrentMatch) {
            highlight.classList.add('pdf-viewer__highlight--current');
          }

          highlight.style.position = 'absolute';
          highlight.style.left = `${rect.left - layerRect.left}px`;
          highlight.style.top = `${rect.top - layerRect.top}px`;
          highlight.style.width = `${rect.width}px`;
          highlight.style.height = `${rect.height}px`;

          textLayer.appendChild(highlight);
          break; // One highlight per match occurrence
        }
        charCount = spanEnd;
      }
      matchIdx++;
      searchStart += lowerQuery.length;
    }
  }, [searchQuery, searchMatches, currentMatchIndex, pageNumber]);

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
