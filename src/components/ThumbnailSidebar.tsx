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

  // Render visible thumbnails
  useEffect(() => {
    if (!document || !isThumbnailsOpen) return;

    for (const pageNum of visibleThumbnails) {
      if (renderedThumbnails.has(pageNum)) continue;

      const canvas = canvasRefs.current.get(pageNum);
      if (!canvas) continue;

      (async () => {
        try {
          const page = await document.getPage(pageNum);
          const viewport = page.getViewport({ scale: THUMBNAIL_SCALE, rotation });
          const context = canvas.getContext('2d');
          if (!context) return;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          await page.render({ canvasContext: context, viewport }).promise;
          setRenderedThumbnails((prev) => new Set(prev).add(pageNum));
        } catch {
          // ignore render errors
        }
      })();
    }
  }, [document, visibleThumbnails, renderedThumbnails, isThumbnailsOpen, rotation]);

  // Re-render when rotation changes
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
            onClick={() => goToPage(pageNum)}
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
