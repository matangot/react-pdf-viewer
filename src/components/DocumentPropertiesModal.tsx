import { useEffect, useRef } from 'react';
import { usePdfViewerContext } from '../context';
import { X } from '../icons';

export function DocumentPropertiesModal() {
  const { isDocPropertiesOpen, docProperties, closeDocProperties } = usePdfViewerContext();
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDocPropertiesOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDocProperties();
    };
    window.document.addEventListener('keydown', handleEscape);
    return () => window.document.removeEventListener('keydown', handleEscape);
  }, [isDocPropertiesOpen, closeDocProperties]);

  if (!isDocPropertiesOpen || !docProperties) return null;

  const rows: [string, string][] = [
    ['Title', docProperties.title],
    ['Author', docProperties.author],
    ['Subject', docProperties.subject],
    ['Creator', docProperties.creator],
    ['Producer', docProperties.producer],
    ['Created', docProperties.creationDate],
    ['Modified', docProperties.modificationDate],
    ['Pages', String(docProperties.pageCount)],
    ['Page Size', docProperties.pageSize],
  ];

  return (
    <div
      ref={backdropRef}
      className="pdf-viewer__modal-backdrop"
      onClick={(e) => {
        if (e.target === backdropRef.current) closeDocProperties();
      }}
    >
      <div className="pdf-viewer__modal" role="dialog" aria-label="Document Properties">
        <div className="pdf-viewer__modal-header">
          <h2 className="pdf-viewer__modal-title">Document Properties</h2>
          <button className="pdf-viewer__btn" onClick={closeDocProperties} aria-label="Close" title="Close">
            <X />
          </button>
        </div>
        <div className="pdf-viewer__modal-body">
          <div className="pdf-viewer__props-file-info">
            <span className="pdf-viewer__props-file-name">{docProperties.fileName}</span>
            <span className="pdf-viewer__props-file-size">{docProperties.fileSize}</span>
          </div>
          <table className="pdf-viewer__props-table">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td className="pdf-viewer__props-label">{label}</td>
                  <td className="pdf-viewer__props-value">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
