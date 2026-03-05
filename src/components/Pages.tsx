import { useEffect, useRef, useState, useCallback } from 'react';
import { usePdfViewerContext } from '../context';
import { VIRTUALIZATION_BUFFER } from '../constants';
import { Page } from './Page';

export interface PagesProps {
  className?: string;
}

export function Pages({ className }: PagesProps) {
  const { totalPages, goToPage } = usePdfViewerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));

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

  // Update currentPage based on topmost visible page
  useEffect(() => {
    if (visiblePages.size > 0) {
      const topmost = Math.min(...visiblePages);
      goToPage(topmost);
    }
  }, [visiblePages, goToPage]);

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
