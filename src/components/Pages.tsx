import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePdfViewerContext } from '../context';
import { VIRTUALIZATION_BUFFER } from '../constants';
import { Page } from './Page';

export interface PagesProps {
  className?: string;
}

export function Pages({ className }: PagesProps) {
  const { totalPages, currentPage, _setCurrentPage, zoomMode, zoomLevel, _setZoomLevel, zoomTo, rotation, document: pdfDoc, containerRef: ctxContainerRef, scrollToPageRef, cursorMode, viewMode, scrollMode, isPrinting } = usePdfViewerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchContentRef = useRef<HTMLDivElement>(null);
  const visiblePagesRef = useRef<Set<number>>(new Set([1]));
  // Base page dimensions at scale=1 (fetched once from page 1)
  const [baseDims, setBaseDims] = useState<{ width: number; height: number } | null>(null);
  const navigatingRef = useRef(false);
  const navigateTargetRef = useRef<number | null>(null);
  const lastReportedPageRef = useRef(1);
  const pageUpdateRafRef = useRef(0);
  // Only re-render when the set of pages to render actually changes
  const [renderGeneration, setRenderGeneration] = useState(0);
  // Pending pinch-to-zoom transition (processed in useLayoutEffect after React renders)
  const pendingZoomRef = useRef<{
    startZoom: number;
    lastScale: number;
    centerX: number;
    centerY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

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

  // Fetch base page dimensions once
  useEffect(() => {
    if (!pdfDoc) return;
    pdfDoc.getPage(1).then((page) => {
      const vp = page.getViewport({ scale: 1, rotation });
      setBaseDims({ width: vp.width, height: vp.height });
    });
  }, [pdfDoc, rotation]);

  // Scroll-based visibility detection (replaces IntersectionObserver for reliability)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibility = () => {
      const wrappersArray = Array.from(
        container.querySelectorAll<HTMLElement>('.pdf-viewer__page-wrapper[data-page-number]')
      );
      const cr = container.getBoundingClientRect();
      const buffer = 200;
      const visible = new Set<number>();
      // Compute current page by most viewport overlap in the same loop (no extra DOM reads).
      let bestPage = 0;
      let bestOverlap = 0;

      for (const el of wrappersArray) {
        const er = el.getBoundingClientRect();
        const pageNum = Number(el.dataset.pageNumber);
        const inView = scrollMode === 'horizontal'
          ? er.right > cr.left - buffer && er.left < cr.right + buffer
          : er.bottom > cr.top - buffer && er.top < cr.bottom + buffer;
        if (inView) visible.add(pageNum);

        // Overlap with the actual viewport (no buffer) for current page detection
        // In dual mode, use 2D area overlap so horizontal scroll within a pair
        // correctly updates the current page to the neighbor page.
        const overlapX = Math.max(0, Math.min(er.right, cr.right) - Math.max(er.left, cr.left));
        const overlapY = Math.max(0, Math.min(er.bottom, cr.bottom) - Math.max(er.top, cr.top));
        let overlap: number;
        if (viewMode === 'dual') {
          overlap = overlapX * overlapY;
        } else if (scrollMode === 'horizontal') {
          overlap = overlapX;
        } else {
          overlap = overlapY;
        }
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          bestPage = pageNum;
        }
      }

      visiblePagesRef.current = visible;
      const newRenderSet = computeRenderSet(visible);
      const oldRenderSet = lastRenderSetRef.current;
      if (newRenderSet.size !== oldRenderSet.size || [...newRenderSet].some(p => !oldRenderSet.has(p))) {
        lastRenderSetRef.current = newRenderSet;
        setRenderGeneration(g => g + 1);
      }

      if (navigatingRef.current) return;
      cancelAnimationFrame(pageUpdateRafRef.current);
      pageUpdateRafRef.current = requestAnimationFrame(() => {
        const target = navigateTargetRef.current;

        if (bestPage === 0 && visible.size > 0) {
          bestPage = Math.min(...visible);
        }

        if (bestPage > 0) {
          // Keep navigate target sticky as long as the target page is visible.
          // This prevents programmatic navigation to the last page from being
          // overridden by the overlap algorithm (since the last page can't be
          // scrolled to fill the viewport).
          const topmost = (target !== null && visible.has(target)) ? target : bestPage;
          if (target !== null && !visible.has(target)) {
            navigateTargetRef.current = null;
          }
          if (topmost !== lastReportedPageRef.current) {
            lastReportedPageRef.current = topmost;
            _setCurrentPageRef.current(topmost);
          }
        }
      });
    };

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateVisibility);
    };

    updateVisibility();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(pageUpdateRafRef.current);
    };
  }, [totalPages, computeRenderSet, scrollMode, zoomLevel, baseDims, viewMode]);

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
        const offset = target.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
        container.scrollTo({ left: offset, behavior: 'instant' });
      } else {
        const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
        container.scrollTo({ top: offset, behavior: 'instant' });
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
        // CSS transform on inner content for instant visual feedback — no re-render.
        // Using the inner wrapper keeps the container's overflow clipping intact,
        // so zoom-out doesn't reveal gray areas beyond the content.
        const content = pinchContentRef.current;
        if (content) {
          content.style.transformOrigin = `${touchStateRef.current.centerX + container.scrollLeft}px ${touchStateRef.current.centerY + container.scrollTop}px`;
          content.style.transform = `scale(${visualScale})`;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStateRef.current) return;

      if (touchStateRef.current.isPinching) {
        const { startZoom, lastScale, centerX, centerY, scrollLeft, scrollTop } = touchStateRef.current;
        touchStateRef.current = null;

        // Keep CSS transform as visual bridge until React re-renders at new zoom.
        // The useLayoutEffect will remove it before the browser paints.
        pendingZoomRef.current = { startZoom, lastScale, centerX, centerY, scrollLeft, scrollTop };
        navigatingRef.current = true;
        zoomTo(lastScale);
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

  // After React renders at a new zoom level, finalize pinch-to-zoom transition
  // and update page visibility — all before the browser paints (no flash / gray gaps).
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Finalize pending pinch-to-zoom: remove CSS transform & set scroll position
    const pending = pendingZoomRef.current;
    if (pending) {
      pendingZoomRef.current = null;
      const content = pinchContentRef.current;
      if (content) {
        content.style.transform = '';
        content.style.transformOrigin = '';
      }

      const zoomRatio = pending.lastScale / pending.startZoom;
      const contentX = pending.scrollLeft + pending.centerX;
      const contentY = pending.scrollTop + pending.centerY;
      container.scrollLeft = Math.max(0, contentX * zoomRatio - pending.centerX);
      container.scrollTop = Math.max(0, contentY * zoomRatio - pending.centerY);
      navigatingRef.current = false;
    }

    // Immediately update visibility so newly-exposed pages render before paint
    const cr = container.getBoundingClientRect();
    const buffer = 200;
    const visible = new Set<number>();
    const wrappers = container.querySelectorAll<HTMLElement>(
      '.pdf-viewer__page-wrapper[data-page-number]'
    );
    for (const el of wrappers) {
      const er = el.getBoundingClientRect();
      const inView = scrollMode === 'horizontal'
        ? er.right > cr.left - buffer && er.left < cr.right + buffer
        : er.bottom > cr.top - buffer && er.top < cr.bottom + buffer;
      if (inView) visible.add(Number(el.dataset.pageNumber));
    }
    visiblePagesRef.current = visible;
    const newRenderSet = computeRenderSet(visible);
    const oldRenderSet = lastRenderSetRef.current;
    if (newRenderSet.size !== oldRenderSet.size || [...newRenderSet].some(p => !oldRenderSet.has(p))) {
      lastRenderSetRef.current = newRenderSet;
      setRenderGeneration(g => g + 1);
    }
  }, [zoomLevel, computeRenderSet, scrollMode]);

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

    const wrapperStyle = baseDims ? {
      width: `${baseDims.width * zoomLevel}px`,
      height: `${baseDims.height * zoomLevel}px`,
    } : undefined;

    return (
      <div
        key={pageNum}
        className={wrapperClass}
        data-page-number={pageNum}
        style={wrapperStyle}
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
      <div ref={pinchContentRef} className="pdf-viewer__pages-content">
        {renderContent()}
      </div>
    </div>
  );
}
