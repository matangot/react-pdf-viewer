import { useState, useEffect, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { usePdfViewerContext } from '../context';
import { ChevronLeft, ChevronRight } from '../icons';

export interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const { currentPage, totalPages, goToPage, nextPage, prevPage } =
    usePdfViewerContext();
  const [inputValue, setInputValue] = useState(String(currentPage));

  // Keep input in sync when currentPage changes externally
  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const page = parseInt(inputValue, 10);
        if (!isNaN(page)) {
          goToPage(page);
        }
      }
    },
    [inputValue, goToPage]
  );

  const handleBlur = useCallback(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const classNames = ['pdf-viewer__navigation', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      <button
        className="pdf-viewer__btn"
        onClick={prevPage}
        disabled={currentPage <= 1}
        title="Previous page"
        aria-label="Previous page"
      >
        <ChevronLeft />
      </button>
      <input
        className="pdf-viewer__page-input"
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-label="Page number"
      />
      <span className="pdf-viewer__page-count">
        <span className="pdf-viewer__page-count-desktop">of {totalPages}</span>
        <span className="pdf-viewer__page-count-mobile">/{totalPages}</span>
      </span>
      <button
        className="pdf-viewer__btn"
        onClick={nextPage}
        disabled={currentPage >= totalPages}
        title="Next page"
        aria-label="Next page"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
