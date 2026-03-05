import { useEffect } from 'react';
import type { PdfViewerContextValue } from '../types';

export function useKeyboardShortcuts(
  containerRef: React.RefObject<HTMLElement | null>,
  ctx: PdfViewerContextValue
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (!isInput) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          e.preventDefault();
          ctx.nextPage();
        }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          ctx.prevPage();
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          ctx.zoomIn();
        }
        if (e.key === '-') {
          e.preventDefault();
          ctx.zoomOut();
        }
        if (e.key === '0') {
          e.preventDefault();
          ctx.zoomTo(1);
        }
        if (e.key === 'f') {
          e.preventDefault();
          const searchInput = el.querySelector<HTMLInputElement>('.pdf-viewer__search-input');
          searchInput?.focus();
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, ctx]);
}
