/**
 * Local Lucide-style icons — SVG paths from lucide.dev, zero dependencies.
 * All icons use 24x24 viewBox with stroke-based rendering.
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const defaults: IconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Icon(props: IconProps & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return <svg {...defaults} {...rest}>{children}</svg>;
}

// Navigation
export function ChevronLeft(props: IconProps) {
  return <Icon {...props}><path d="m15 18-6-6 6-6" /></Icon>;
}

export function ChevronRight(props: IconProps) {
  return <Icon {...props}><path d="m9 18 6-6-6-6" /></Icon>;
}

export function ChevronsLeft(props: IconProps) {
  return <Icon {...props}><path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" /></Icon>;
}

export function ChevronsRight(props: IconProps) {
  return <Icon {...props}><path d="m6 17 5-5-5-5" /><path d="m13 17 5-5-5-5" /></Icon>;
}

export function ChevronUp(props: IconProps) {
  return <Icon {...props}><path d="m18 15-6-6-6 6" /></Icon>;
}

export function ChevronDown(props: IconProps) {
  return <Icon {...props}><path d="m6 9 6 6 6-6" /></Icon>;
}

// Zoom
export function Minus(props: IconProps) {
  return <Icon {...props}><path d="M5 12h14" /></Icon>;
}

export function Plus(props: IconProps) {
  return <Icon {...props}><path d="M5 12h14" /><path d="M12 5v14" /></Icon>;
}

export function ArrowLeftRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      <path d="M7 12h10" />
    </Icon>
  );
}

export function RectangleVertical(props: IconProps) {
  return <Icon {...props}><rect width="12" height="18" x="6" y="3" rx="2" /></Icon>;
}

// Search
export function SearchIcon(props: IconProps) {
  return <Icon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>;
}

export function X(props: IconProps) {
  return <Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;
}

// Actions
export function RotateCw(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </Icon>
  );
}

export function RotateCcw(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </Icon>
  );
}

export function Download(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </Icon>
  );
}

export function Printer(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 9V3h12v6" />
      <rect width="12" height="8" x="6" y="14" />
    </Icon>
  );
}

export function Maximize(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </Icon>
  );
}

export function Expand(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8" />
      <path d="M3 16.2V21m0 0h4.8M3 21l6-6" />
      <path d="M21 7.8V3m0 0h-4.8M21 3l-6 6" />
      <path d="M3 7.8V3m0 0h4.8M3 3l6 6" />
    </Icon>
  );
}

// Cursor modes
export function Hand(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </Icon>
  );
}

export function MousePointer(props: IconProps) {
  return <Icon {...props}><path d="M3 3l7.07 17 2.51-7.39L20 10.07z" /></Icon>;
}

// Layout
export function FileText(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </Icon>
  );
}

export function StickyNote(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
      <path d="M14 3v4a2 2 0 0 0 2 2h4" />
    </Icon>
  );
}

export function Columns2(props: IconProps) {
  return (
    <Icon {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M12 3v18" />
    </Icon>
  );
}

export function GalleryVertical(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 2h18" />
      <rect width="18" height="12" x="3" y="6" rx="2" />
      <path d="M3 22h18" />
    </Icon>
  );
}

export function GalleryHorizontal(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 3v18" />
      <rect width="12" height="18" x="6" y="3" rx="2" />
      <path d="M22 3v18" />
    </Icon>
  );
}

export function GalleryThumbnails(props: IconProps) {
  return (
    <Icon {...props}>
      <rect width="18" height="14" x="3" y="2" rx="2" />
      <rect width="4" height="2" x="4" y="18" rx="1" />
      <rect width="4" height="2" x="10" y="18" rx="1" />
      <rect width="4" height="2" x="16" y="18" rx="1" />
    </Icon>
  );
}

export function Check(props: IconProps) {
  return <Icon {...props}><path d="M20 6 9 17l-5-5" /></Icon>;
}

// Misc
export function EllipsisVertical(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </Icon>
  );
}

export function Info(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

export function PanelLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </Icon>
  );
}

export function Sun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </Icon>
  );
}

export function ArrowDownToLine(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 17V3" />
      <path d="m6 11 6 6 6-6" />
      <path d="M19 21H5" />
    </Icon>
  );
}

export function Scan(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </Icon>
  );
}

export function Moon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Icon>
  );
}
