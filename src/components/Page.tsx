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

      // Cap canvas pixels to avoid exceeding mobile browser limits (~16M pixels)
      const MAX_CANVAS_PIXELS = 16_777_216;
      const baseDpr = window.devicePixelRatio || 1;
      const basePixels = viewport.width * baseDpr * viewport.height * baseDpr;
      const dpr = basePixels > MAX_CANVAS_PIXELS
        ? Math.sqrt(MAX_CANVAS_PIXELS / (viewport.width * viewport.height))
        : baseDpr;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
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
        const textLayerDiv = textLayerRef.current;
        textLayerDiv.innerHTML = '';
        // pdf.js v4 TextLayer uses --scale-factor CSS variable for dimensions
        textLayerDiv.style.setProperty('--scale-factor', String(viewport.scale));

        const textContent = await page.getTextContent();
        const { TextLayer } = await import('pdfjs-dist');

        const textLayer = new TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
        });
        await textLayer.render();
        // Re-apply search highlights after text layer is ready
        requestAnimationFrame(() => applyHighlightsRef.current?.());
      }
    } catch (err: unknown) {
      // Ignore cancelled render errors
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') return;
    }
  }, [document, pageNumber, zoomLevel, rotation]);

  // Highlight search matches by wrapping matched substrings in <mark> elements
  const applyHighlights = useCallback(() => {
    const textLayer = textLayerRef.current;
    if (!textLayer) return;

    // Clear previous highlights — restore original text nodes
    textLayer.querySelectorAll('mark.pdf-viewer__search-hit').forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(window.document.createTextNode(mark.textContent || ''), mark);
        parent.normalize(); // merge adjacent text nodes
      }
    });

    if (!searchQuery || searchMatches.length === 0) return;

    const pageMatches = searchMatches.filter((m) => m.pageIndex === pageNumber - 1);
    if (pageMatches.length === 0) return;

    const lowerQuery = searchQuery.toLowerCase();
    const queryLen = searchQuery.length;
    const spans = Array.from(textLayer.querySelectorAll('span'));

    let pageMatchIdx = 0;
    for (const span of spans) {
      const text = span.textContent || '';
      const lowerText = text.toLowerCase();
      let idx = lowerText.indexOf(lowerQuery);
      if (idx === -1) continue;

      // Build fragments: text before match, <mark>match</mark>, text after, repeat
      const frag = window.document.createDocumentFragment();
      let lastIdx = 0;

      while (idx !== -1) {
        // Text before match
        if (idx > lastIdx) {
          frag.appendChild(window.document.createTextNode(text.slice(lastIdx, idx)));
        }

        // The match itself
        const mark = window.document.createElement('mark');
        mark.className = 'pdf-viewer__search-hit';
        mark.textContent = text.slice(idx, idx + queryLen);

        // Check if this is the current active match
        if (pageMatchIdx < pageMatches.length) {
          const globalIdx = searchMatches.indexOf(pageMatches[pageMatchIdx]);
          if (globalIdx === currentMatchIndex) {
            mark.classList.add('pdf-viewer__search-hit--current');
          }
        }
        pageMatchIdx++;

        frag.appendChild(mark);
        lastIdx = idx + queryLen;
        idx = lowerText.indexOf(lowerQuery, lastIdx);
      }

      // Remaining text after last match
      if (lastIdx < text.length) {
        frag.appendChild(window.document.createTextNode(text.slice(lastIdx)));
      }

      span.textContent = '';
      span.appendChild(frag);
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
