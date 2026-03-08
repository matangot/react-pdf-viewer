import { useEffect, useRef, useState, useCallback } from 'react';
import { usePdfViewerContext } from '../context';
import { THUMBNAIL_SCALE } from '../constants';

export interface ThumbnailSidebarProps {
  className?: string;
}

export function ThumbnailSidebar({ className }: ThumbnailSidebarProps) {
  const { document, totalPages, currentPage, goToPage, isThumbnailsOpen, rotation } =
    usePdfViewerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleThumbnails, setVisibleThumbnails] = useState<Set<number>>(new Set());
  const [renderedThumbnails, setRenderedThumbnails] = useState<Set<number>>(new Set());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderingPages = useRef<Set<number>>(new Set());

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      setVisibleThumbnails((prev) => {
        const next = new Set(prev);
        for (const entry of entries) {
          const pageNum = Number(
            (entry.target as HTMLElement).dataset.thumbnailPage
          );
          if (entry.isIntersecting) {
            next.add(pageNum);
          } else {
            next.delete(pageNum);
          }
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isThumbnailsOpen) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: container,
      rootMargin: '100px 0px',
    });

    const items = container.querySelectorAll('[data-thumbnail-page]');
    items.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [totalPages, isThumbnailsOpen, handleIntersection]);

  // Render visible thumbnails — one at a time to avoid pdf.js render races
  useEffect(() => {
    if (!document || !isThumbnailsOpen) return;

    let cancelled = false;

    async function renderQueue() {
      for (const pageNum of visibleThumbnails) {
        if (cancelled) break;
        if (renderedThumbnails.has(pageNum)) continue;
        if (renderingPages.current.has(pageNum)) continue;

        const canvas = canvasRefs.current.get(pageNum);
        if (!canvas) continue;

        renderingPages.current.add(pageNum);
        try {
          const page = await document!.getPage(pageNum);
          if (cancelled) break;

          const viewport = page.getViewport({ scale: THUMBNAIL_SCALE, rotation });
          const context = canvas.getContext('2d');
          if (!context) { renderingPages.current.delete(pageNum); continue; }

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          await page.render({ canvasContext: context, viewport }).promise;
          if (!cancelled) {
            setRenderedThumbnails((prev) => new Set(prev).add(pageNum));
          }
        } catch {
          // ignore render errors
        } finally {
          renderingPages.current.delete(pageNum);
        }
      }
    }

    renderQueue();
    return () => { cancelled = true; };
  }, [document, visibleThumbnails, renderedThumbnails, isThumbnailsOpen, rotation]);

  // Scroll active thumbnail into view when currentPage changes
  const lastClickedRef = useRef<number | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isThumbnailsOpen) return;
    // Skip if this page change was from clicking a thumbnail
    if (lastClickedRef.current === currentPage) {
      lastClickedRef.current = null;
      return;
    }
    const active = container.querySelector(`[data-thumbnail-page="${currentPage}"]`) as HTMLElement | null;
    if (!active) return;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elTop = active.offsetTop - container.offsetTop;
    const elBottom = elTop + active.offsetHeight;
    if (elTop < containerTop || elBottom > containerBottom) {
      container.scrollTo({ top: Math.max(0, elTop - 8) });
    }
  }, [currentPage, isThumbnailsOpen]);

  // Clear rendered state when sidebar closes (canvases are unmounted) or rotation changes
  useEffect(() => {
    if (isThumbnailsOpen) return;
    setRenderedThumbnails(new Set());
    renderingPages.current.clear();
  }, [isThumbnailsOpen]);

  useEffect(() => {
    setRenderedThumbnails(new Set());
  }, [rotation]);

  if (!isThumbnailsOpen) return null;

  const classNames = ['pdf-viewer__sidebar', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className={classNames}>
      {Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        return (
          <button
            key={pageNum}
            className={`pdf-viewer__thumbnail${currentPage === pageNum ? ' pdf-viewer__thumbnail--active' : ''}`}
            data-thumbnail-page={pageNum}
            onClick={() => { lastClickedRef.current = pageNum; goToPage(pageNum); }}
          >
            <canvas
              ref={(el) => {
                if (el) {
                  canvasRefs.current.set(pageNum, el);
                } else {
                  canvasRefs.current.delete(pageNum);
                }
              }}
            />
            <span>{pageNum}</span>
          </button>
        );
      })}
    </div>
  );
}
