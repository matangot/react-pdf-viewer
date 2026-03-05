import { useState, useCallback, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { usePdfViewerContext } from '../context';
import { SearchIcon, ChevronUp, ChevronDown, X } from '../icons';

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

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    clearSearch();
  }, [clearSearch]);

  // Auto-focus input when panel opens
  const inputCallbackRef = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    node?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.document.addEventListener('keydown', handleEscape);
    return () => window.document.removeEventListener('keydown', handleEscape);
  }, [open, handleClose]);

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
      }
    },
    [nextMatch, prevMatch]
  );

  const classNames = ['pdf-viewer__search-toggle', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} ref={panelRef}>
      <button
        className="pdf-viewer__btn"
        onClick={handleOpen}
        title="Search"
        aria-label="Search in document"
      >
        <SearchIcon />
      </button>
      {open && (
        <div className="pdf-viewer__search-panel">
          <div className="pdf-viewer__search-input-wrapper">
            <div className="pdf-viewer__search-input-icon">
              <SearchIcon />
            </div>
            <input
              ref={inputCallbackRef}
              className="pdf-viewer__search-panel-input"
              type="text"
              placeholder="Search..."
              aria-label="Search in document"
              value={searchQuery}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </div>
          <span className="pdf-viewer__search-count">
            {searchQuery && searchMatches.length > 0
              ? `${currentMatchIndex + 1}/${searchMatches.length}`
              : '0/0'}
          </span>
          <button
            className="pdf-viewer__btn pdf-viewer__btn--small"
            onClick={prevMatch}
            disabled={searchMatches.length === 0}
            title="Previous match"
            aria-label="Previous match"
          >
            <ChevronUp />
          </button>
          <button
            className="pdf-viewer__btn pdf-viewer__btn--small"
            onClick={nextMatch}
            disabled={searchMatches.length === 0}
            title="Next match"
            aria-label="Next match"
          >
            <ChevronDown />
          </button>
          <button
            className="pdf-viewer__btn pdf-viewer__btn--small"
            onClick={handleClose}
            title="Close search"
            aria-label="Close search"
          >
            <X />
          </button>
        </div>
      )}
    </div>
  );
}
