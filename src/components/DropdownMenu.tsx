import { useState, useRef, useEffect, useCallback, useLayoutEffect, type ReactNode } from 'react';
import { Check } from '../icons';

export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  title?: string;
  triggerClassName?: string;
}

export function DropdownMenu({ trigger, children, className, align = 'right', title = 'More actions', triggerClassName }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.document.addEventListener('mousedown', handleClickOutside);
    window.document.addEventListener('keydown', handleEscape);
    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
      window.document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  useLayoutEffect(() => {
    if (!open || !contentRef.current) return;
    const el = contentRef.current;
    const viewer = el.closest('.pdf-viewer') as HTMLElement | null;
    if (!viewer) return;
    const viewerRect = viewer.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const available = viewerRect.bottom - elRect.top - 32;
    if (available > 0) {
      el.style.maxHeight = `${available}px`;
    }
  }, [open]);

  const classNames = ['pdf-viewer__dropdown', className].filter(Boolean).join(' ');

  return (
    <div ref={menuRef} className={classNames}>
      <button
        className={triggerClassName ?? 'pdf-viewer__btn'}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title}
        aria-label={title}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={contentRef}
          className={`pdf-viewer__dropdown-content pdf-viewer__dropdown-content--${align}`}
          role="menu"
          onClick={close}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface DropdownMenuItemProps {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

export function DropdownMenuItem({ icon, label, onClick, disabled, active }: DropdownMenuItemProps) {
  const classNames = [
    'pdf-viewer__dropdown-item',
    active && 'pdf-viewer__dropdown-item--active',
    disabled && 'pdf-viewer__dropdown-item--disabled',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      role="menuitem"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon && <span className="pdf-viewer__dropdown-item-icon">{icon}</span>}
      <span className="pdf-viewer__dropdown-item-label">{label}</span>
      {active && <span className="pdf-viewer__dropdown-item-check"><Check /></span>}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="pdf-viewer__dropdown-separator" role="separator" />;
}
