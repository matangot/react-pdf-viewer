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

  // Highlight search matches — placed in highlightLayerRef (sibling of text layer, full opacity)
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const applyHighlights = useCallback(() => {
    const textLayer = textLayerRef.current;
    const highlightLayer = highlightLayerRef.current;
    if (!textLayer || !highlightLayer) return;

    // Clear previous highlights
    highlightLayer.innerHTML = '';

    if (!searchQuery || searchMatches.length === 0) return;

    // Find matches on this page
    const pageMatches = searchMatches.filter((m) => m.pageIndex === pageNumber - 1);
    if (pageMatches.length === 0) return;

    // Get all text spans rendered by pdf.js
    const spans = Array.from(textLayer.querySelectorAll('span'));
    if (spans.length === 0) return;

    const pageRect = highlightLayer.parentElement!.getBoundingClientRect();
    const lowerQuery = searchQuery.toLowerCase();

    // For each span, check if it contains matching text
    let pageMatchIdx = 0;
    for (const span of spans) {
      const spanText = (span.textContent || '').toLowerCase();
      let idx = spanText.indexOf(lowerQuery);
      while (idx !== -1) {
        const spanRect = span.getBoundingClientRect();

        const highlight = window.document.createElement('div');
        highlight.className = 'pdf-viewer__highlight';

        // Check if this is the current match
        if (pageMatchIdx < pageMatches.length) {
          const globalIdx = searchMatches.indexOf(pageMatches[pageMatchIdx]);
          if (globalIdx === currentMatchIndex) {
            highlight.classList.add('pdf-viewer__highlight--current');
          }
        }

        highlight.style.cssText = `
          position: absolute;
          left: ${spanRect.left - pageRect.left}px;
          top: ${spanRect.top - pageRect.top}px;
          width: ${spanRect.width}px;
          height: ${spanRect.height}px;
        `;

        highlightLayer.appendChild(highlight);
        pageMatchIdx++;
        idx = spanText.indexOf(lowerQuery, idx + lowerQuery.length);
      }
    }
  }, [searchQuery, searchMatches, currentMatchIndex, pageNumber]);

  // Re-apply highlights when search state changes or after render completes
  useEffect(() => {
    // Small delay to ensure text layer is rendered
    const timer = setTimeout(applyHighlights, 100);
    return () => clearTimeout(timer);
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
      <div ref={highlightLayerRef} className="pdf-viewer__highlight-layer" />
    </div>
  );
}
