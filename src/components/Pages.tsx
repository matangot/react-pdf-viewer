import { useCallback, useEffect, useRef, useState } from 'react';
import { usePdfViewerContext } from '../context';
import { VIRTUALIZATION_BUFFER } from '../constants';
import { Page } from './Page';

export interface PagesProps {
  className?: string;
}

export function Pages({ className }: PagesProps) {
  const { totalPages, currentPage, _setCurrentPage, zoomMode, zoomLevel, _setZoomLevel, zoomTo, rotation, document: pdfDoc, containerRef: ctxContainerRef, scrollToPageRef, cursorMode, viewMode, scrollMode, isPrinting } = usePdfViewerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const visiblePagesRef = useRef<Set<number>>(new Set([1]));
  // Base page dimensions at scale=1 (fetched once from page 1)
  const [baseDims, setBaseDims] = useState<{ width: number; height: number } | null>(null);
  const navigatingRef = useRef(false);
  const navigateTargetRef = useRef<number | null>(null);
  const lastReportedPageRef = useRef(1);
  const pageUpdateRafRef = useRef(0);
  // Only re-render when the set of pages to render actually changes
  const [renderGeneration, setRenderGeneration] = useState(0);

  const computeRenderSet = useCallback((visible: Set<number>): Set<number> => {
    const result = new Set<number>();
    for (const v of visible) {
      for (let offset = -VIRTUALIZATION_BUFFER; offset <= VIRTUALIZATION_BUFFER; offset++) {
        const p = v + offset;
        if (p >= 1 && p <= totalPages) result.add(p);
      }
    }
    return result;
  }, [totalPages]);

  const lastRenderSetRef = useRef<Set<number>>(computeRenderSet(new Set([1])));
  const _setCurrentPageRef = useRef(_setCurrentPage);
  _setCurrentPageRef.current = _setCurrentPage;

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const prev = visiblePagesRef.current;
      for (const entry of entries) {
        const pageNum = Number(
          (entry.target as HTMLElement).dataset.pageNumber
        );
        if (entry.isIntersecting) {
          prev.add(pageNum);
        } else {
          prev.delete(pageNum);
        }
      }

      // Only trigger re-render if the set of pages we should render changes
      const newRenderSet = computeRenderSet(prev);
      const oldRenderSet = lastRenderSetRef.current;
      if (newRenderSet.size !== oldRenderSet.size || [...newRenderSet].some(p => !oldRenderSet.has(p))) {
        lastRenderSetRef.current = newRenderSet;
        setRenderGeneration(g => g + 1);
      }

      // Debounce current page updates — coalesce rapid IO events into one update
      if (navigatingRef.current) return;
      cancelAnimationFrame(pageUpdateRafRef.current);
      pageUpdateRafRef.current = requestAnimationFrame(() => {
        const visible = visiblePagesRef.current;
        if (visible.size > 0) {
          // If we navigated to a specific page and it's still visible, keep it as current
          const target = navigateTargetRef.current;
          const topmost = (target !== null && visible.has(target)) ? target : Math.min(...visible);
          navigateTargetRef.current = null;
          if (topmost !== lastReportedPageRef.current) {
            lastReportedPageRef.current = topmost;
            _setCurrentPageRef.current(topmost);
          }
        }
      });
    },
    [computeRenderSet]
  );

  // Fetch base page dimensions once
  useEffect(() => {
    if (!pdfDoc) return;
    pdfDoc.getPage(1).then((page) => {
      const vp = page.getViewport({ scale: 1, rotation });
      setBaseDims({ width: vp.width, height: vp.height });
    });
  }, [pdfDoc, rotation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: container,
      rootMargin: scrollMode === 'horizontal' ? '0px 200px' : '200px 0px',
    });

    const wrappers = container.querySelectorAll('[data-page-number]');
    wrappers.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [totalPages, handleIntersection, scrollMode]);

  // Reset navigating flag after programmatic scroll settles
  const navigatingTimerRef = useRef(0);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScrollEnd = () => {
      if (navigatingRef.current) {
        // Delay reset to let IO observer fire and be ignored
        clearTimeout(navigatingTimerRef.current);
        navigatingTimerRef.current = window.setTimeout(() => {
          navigatingRef.current = false;
        }, 100);
      }
    };
    container.addEventListener('scrollend', handleScrollEnd);
    return () => {
      container.removeEventListener('scrollend', handleScrollEnd);
      clearTimeout(navigatingTimerRef.current);
    };
  }, []);

  // Expose scrollToPage function via context ref — called by programmatic navigation
  useEffect(() => {
    if (!scrollToPageRef) return;
    scrollToPageRef.current = (page: number) => {
      // Sync lastReportedPageRef so the IO observer won't override the navigated page
      lastReportedPageRef.current = page;
      navigateTargetRef.current = page;
      if (scrollMode === 'page') {
        // In page scroll mode, navigation is handled by re-render (active class)
        navigatingRef.current = false;
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const wrapper = container.querySelector(`[data-page-number="${page}"]`) as HTMLElement | null;
      if (!wrapper) return;
      // In dual mode, scroll to the pair container instead of individual page
      const target = (viewMode === 'dual' ? wrapper.closest('.pdf-viewer__page-pair') as HTMLElement : wrapper) ?? wrapper;
      navigatingRef.current = true;
      // Fallback: if scrollTo doesn't actually scroll (already at position), scrollend won't fire
      clearTimeout(navigatingTimerRef.current);
      navigatingTimerRef.current = window.setTimeout(() => {
        navigatingRef.current = false;
      }, 150);
      if (scrollMode === 'horizontal') {
        container.scrollTo({ left: target.offsetLeft - container.offsetLeft });
      } else {
        container.scrollTo({ top: target.offsetTop - container.offsetTop });
      }
    };
  }, [scrollToPageRef, scrollMode, viewMode]);

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
        const padding = 32;
        const gap = 16;
        const containerWidth = containerRef.current!.clientWidth - padding;
        const containerHeight = containerRef.current!.clientHeight - padding;

        // In dual mode, each page gets half the width minus the gap
        const availableWidth = viewMode === 'dual'
          ? (containerWidth - gap) / 2
          : containerWidth;

        if (zoomMode === 'fit-width') {
          const scale = availableWidth / viewport.width;
          _setZoomLevel(scale);
        } else if (zoomMode === 'fit-page') {
          const scaleW = availableWidth / viewport.width;
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
  }, [zoomMode, pdfDoc, _setZoomLevel, viewMode]);

  // Hand tool: drag-to-scroll
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (cursorMode !== 'hand') return;
    const container = containerRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
    container.style.cursor = 'grabbing';
    e.preventDefault();
  }, [cursorMode]);

  useEffect(() => {
    if (cursorMode !== 'hand') return;
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      container.scrollLeft = dragStartRef.current.scrollLeft - dx;
      container.scrollTop = dragStartRef.current.scrollTop - dy;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      container.style.cursor = '';
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [cursorMode]);

  // Touch gestures: pinch-to-zoom and swipe-to-change-page
  const touchStateRef = useRef<{
    startDistance: number;
    startZoom: number;
    startX: number;
    startY: number;
    startTime: number;
    isPinching: boolean;
    lastScale: number;
    // Pinch center relative to container viewport
    centerX: number;
    centerY: number;
    // Scroll position at pinch start
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  // Store latest zoomLevel in a ref so touch handlers don't need it as a dep
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getDistance = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const getMidpoint = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        const mid = getMidpoint(e.touches[0], e.touches[1]);
        const rect = container.getBoundingClientRect();
        touchStateRef.current = {
          startDistance: dist,
          startZoom: zoomLevelRef.current,
          startX: 0,
          startY: 0,
          startTime: 0,
          isPinching: true,
          lastScale: zoomLevelRef.current,
          centerX: mid.x - rect.left,
          centerY: mid.y - rect.top,
          scrollLeft: container.scrollLeft,
          scrollTop: container.scrollTop,
        };
      } else if (e.touches.length === 1) {
        touchStateRef.current = {
          startDistance: 0,
          startZoom: zoomLevelRef.current,
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startTime: Date.now(),
          isPinching: false,
          lastScale: zoomLevelRef.current,
          centerX: 0,
          centerY: 0,
          scrollLeft: 0,
          scrollTop: 0,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStateRef.current) return;

      if (e.touches.length === 2 && touchStateRef.current.isPinching) {
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        const scale = dist / touchStateRef.current.startDistance;
        const clamped = Math.max(0.25, Math.min(4, touchStateRef.current.startZoom * scale));
        const visualScale = clamped / touchStateRef.current.startZoom;
        touchStateRef.current.lastScale = clamped;
        // CSS transform for instant visual feedback — no re-render
        container.style.transformOrigin = `${touchStateRef.current.centerX}px ${touchStateRef.current.centerY}px`;
        container.style.transform = `scale(${visualScale})`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStateRef.current) return;

      if (touchStateRef.current.isPinching) {
        const { startZoom, lastScale, centerX, centerY, scrollLeft, scrollTop } = touchStateRef.current;
        // Remove CSS transform
        container.style.transform = '';
        container.style.transformOrigin = '';
        touchStateRef.current = null;

        // Calculate scroll position to keep pinch center in same place
        const zoomRatio = lastScale / startZoom;
        const contentX = scrollLeft + centerX;
        const contentY = scrollTop + centerY;
        const newScrollLeft = contentX * zoomRatio - centerX;
        const newScrollTop = contentY * zoomRatio - centerY;

        // Temporarily lock scroll tracking during zoom transition
        navigatingRef.current = true;
        zoomTo(lastScale);
        // Wait for React to re-render pages at new size, then set scroll
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            container.scrollLeft = Math.max(0, newScrollLeft);
            container.scrollTop = Math.max(0, newScrollTop);
            navigatingRef.current = false;
          });
        });
        return;
      }

      touchStateRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [zoomTo, scrollMode]);

  const isPageScroll = scrollMode === 'page';

  const shouldRenderPage = (pageNum: number): boolean => {
    if (isPrinting) return true;
    if (isPageScroll) {
      // In page scroll mode, render current page and neighbors for fast switching
      return Math.abs(pageNum - currentPage) <= VIRTUALIZATION_BUFFER;
    }
    // renderGeneration ensures we re-render when this set changes
    void renderGeneration;
    return lastRenderSetRef.current.has(pageNum);
  };

  const classNames = [
    'pdf-viewer__pages',
    `pdf-viewer__pages--scroll-${scrollMode}`,
    viewMode === 'dual' && 'pdf-viewer__pages--dual',
    cursorMode === 'hand' && 'pdf-viewer__pages--hand',
    className,
  ].filter(Boolean).join(' ');

  const renderPageWrapper = (pageNum: number) => {
    const isActive = isPageScroll && pageNum === currentPage;
    const wrapperClass = [
      'pdf-viewer__page-wrapper',
      isActive && 'pdf-viewer__page-wrapper--active',
    ].filter(Boolean).join(' ');

    return (
      <div
        key={pageNum}
        className={wrapperClass}
        data-page-number={pageNum}
      >
        {shouldRenderPage(pageNum) ? (
          <Page pageNumber={pageNum} />
        ) : (
          <div
            className="pdf-viewer__page-placeholder"
            style={baseDims ? {
              width: `${baseDims.width * zoomLevel}px`,
              height: `${baseDims.height * zoomLevel}px`,
            } : undefined}
          />
        )}
      </div>
    );
  };

  const renderContent = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    if (viewMode === 'dual') {
      const pairs: number[][] = [];
      for (let i = 0; i < pages.length; i += 2) {
        pairs.push(pages.slice(i, i + 2));
      }
      return pairs.map((pair) => {
        const isActive = isPageScroll && pair.includes(currentPage);
        const pairClass = [
          'pdf-viewer__page-pair',
          isActive && 'pdf-viewer__page-pair--active',
        ].filter(Boolean).join(' ');
        return (
          <div key={pair[0]} className={pairClass}>
            {pair.map(renderPageWrapper)}
          </div>
        );
      });
    }

    return pages.map(renderPageWrapper);
  };

  return (
    <div ref={containerRef} className={classNames} onMouseDown={handleMouseDown}>
      {renderContent()}
    </div>
  );
}
