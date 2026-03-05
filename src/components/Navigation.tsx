import { useState, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { usePdfViewerContext } from '../context';

export interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const { currentPage, totalPages, goToPage, nextPage, prevPage } =
    usePdfViewerContext();
  const [inputValue, setInputValue] = useState(String(currentPage));

  // Keep input in sync when currentPage changes externally
  const prevCurrentPage = useState(currentPage)[0];
  if (prevCurrentPage !== currentPage) {
    setInputValue(String(currentPage));
  }

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
        aria-label="Previous page"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 12L6 8L10 4" />
        </svg>
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
      <span>of {totalPages}</span>
      <button
        className="pdf-viewer__btn"
        onClick={nextPage}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4L10 8L6 12" />
        </svg>
      </button>
    </div>
  );
}
