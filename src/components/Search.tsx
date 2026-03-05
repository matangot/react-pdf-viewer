import { useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { usePdfViewerContext } from '../context';

export interface SearchProps {
  className?: string;
}

export function Search({ className }: SearchProps) {
  const {
    searchQuery,
    searchMatches,
    currentMatchIndex,
    search,
    nextMatch,
    prevMatch,
    clearSearch,
  } = usePdfViewerContext();

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      search(e.target.value);
    },
    [search]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          prevMatch();
        } else {
          nextMatch();
        }
      } else if (e.key === 'Escape') {
        clearSearch();
        (e.target as HTMLInputElement).blur();
      }
    },
    [nextMatch, prevMatch, clearSearch]
  );

  const classNames = ['pdf-viewer__search', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      <input
        className="pdf-viewer__search-input"
        type="text"
        placeholder="Search..."
        aria-label="Search in document"
        value={searchQuery}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {searchQuery && (
        <>
          <span className="pdf-viewer__search-count">
            {searchMatches.length > 0
              ? `${currentMatchIndex + 1} of ${searchMatches.length}`
              : 'No matches'}
          </span>
          {searchMatches.length > 0 && (
            <>
              <button
                className="pdf-viewer__btn"
                onClick={prevMatch}
                aria-label="Previous match"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 10L8 6L4 10" />
                </svg>
              </button>
              <button
                className="pdf-viewer__btn"
                onClick={nextMatch}
                aria-label="Next match"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6L8 10L12 6" />
                </svg>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
