import { useRef } from 'react';
import { PdfViewerProvider, usePdfViewerContext } from '../context';
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts';
import type { PdfViewerRootProps, Theme } from '../types';

interface RootInnerProps {
  className?: string;
  theme: Theme;
  children: React.ReactNode;
}

function RootInner({ className, theme, children }: RootInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctx = usePdfViewerContext();

  useKeyboardShortcuts(containerRef, ctx);

  const classNames = [
    'pdf-viewer',
    ctx.isLoading && 'pdf-viewer--loading',
    ctx.error && 'pdf-viewer--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={classNames}
      data-theme={theme}
      tabIndex={-1}
    >
      {ctx.error ? (
        <div className="pdf-viewer__error">
          <p>{ctx.error.message}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function Root({
  src,
  defaultPage,
  defaultZoom,
  defaultCursorMode,
  defaultSidebarOpen,
  theme = 'system',
  onPageChange,
  onDocumentLoad,
  className,
  children,
}: PdfViewerRootProps) {
  return (
    <PdfViewerProvider
      src={src}
      defaultPage={defaultPage}
      defaultZoom={defaultZoom}
      defaultCursorMode={defaultCursorMode}
      defaultSidebarOpen={defaultSidebarOpen}
      onPageChange={onPageChange}
      onDocumentLoad={onDocumentLoad}
    >
      <RootInner className={className} theme={theme}>
        {children}
      </RootInner>
    </PdfViewerProvider>
  );
}
