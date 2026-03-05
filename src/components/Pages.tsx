import { useEffect, useRef, useState, useCallback } from 'react';
import { usePdfViewerContext } from '../context';
import { VIRTUALIZATION_BUFFER } from '../constants';
import { Page } from './Page';

export interface PagesProps {
  className?: string;
}

export function Pages({ className }: PagesProps) {
  const { totalPages, goToPage, currentPage, zoomMode, _setZoomLevel, document: pdfDoc, containerRef: ctxContainerRef } = usePdfViewerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const isUserScrollRef = useRef(true);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      setVisiblePages((prev) => {
        const next = new Set(prev);
        for (const entry of entries) {
          const pageNum = Number(
            (entry.target as HTMLElement).dataset.pageNumber
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
    if (!container) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: container,
      rootMargin: '200px 0px',
    });

    const wrappers = container.querySelectorAll('[data-page-number]');
    wrappers.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [totalPages, handleIntersection]);

  // Update currentPage based on topmost visible page (only on user scroll)
  useEffect(() => {
    if (visiblePages.size > 0 && isUserScrollRef.current) {
      const topmost = Math.min(...visiblePages);
      if (topmost !== currentPage) {
        goToPage(topmost);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePages]);

  // Set the container ref on context for fit-zoom calculations
  useEffect(() => {
    if (containerRef.current && ctxContainerRef) {
      ctxContainerRef.current = containerRef.current;
    }
  });

  // Compute fit-zoom when zoomMode changes or on container resize
  useEffect(() => {
    if (!zoomMode || !pdfDoc || !containerRef.current) return;

    const computeFitZoom = () => {
      if (!containerRef.current || !pdfDoc) return;
      pdfDoc.getPage(1).then((page) => {
        const viewport = page.getViewport({ scale: 1, rotation: 0 });
        const containerWidth = containerRef.current!.clientWidth - 32;
        const containerHeight = containerRef.current!.clientHeight - 32;

        if (zoomMode === 'fit-width') {
          const scale = containerWidth / viewport.width;
          _setZoomLevel(scale);
        } else if (zoomMode === 'fit-page') {
          const scaleW = containerWidth / viewport.width;
          const scaleH = containerHeight / viewport.height;
          _setZoomLevel(Math.min(scaleW, scaleH));
        }
      });
    };

    computeFitZoom();

    const resizeObserver = new ResizeObserver(() => {
      computeFitZoom();
    });
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [zoomMode, pdfDoc, _setZoomLevel]);

  const shouldRenderPage = (pageNum: number): boolean => {
    for (const visible of visiblePages) {
      if (Math.abs(pageNum - visible) <= VIRTUALIZATION_BUFFER) {
        return true;
      }
    }
    return false;
  };

  const classNames = ['pdf-viewer__pages', className].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={classNames}>
      {Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        return (
          <div
            key={pageNum}
            className="pdf-viewer__page-wrapper"
            data-page-number={pageNum}
          >
            {shouldRenderPage(pageNum) ? (
              <Page pageNumber={pageNum} />
            ) : (
              <div className="pdf-viewer__page-placeholder" />
            )}
          </div>
        );
      })}
    </div>
  );
}
