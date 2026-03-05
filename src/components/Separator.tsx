export interface SeparatorProps {
  className?: string;
}

export function Separator({ className }: SeparatorProps) {
  const classNames = ['pdf-viewer__separator', className]
    .filter(Boolean)
    .join(' ');

  return <div className={classNames} role="separator" />;
}
