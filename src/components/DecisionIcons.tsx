/**
 * Decision icons shared between the landing page and the canvas.
 * Stroke-based, inherit `currentColor` so the parent sets the color.
 */
import type { TagKey } from "@/lib/tags";

type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function iconProps({ size = 16, strokeWidth = 1.75, className }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
}

export function TrashIcon(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function BotIcon(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M12 2v3" />
      <circle cx="12" cy="2" r="0.6" fill="currentColor" stroke="none" />
      <rect x="4" y="6" width="16" height="13" rx="3" />
      <circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M9 16h6" />
      <path d="M3 12v3" />
      <path d="M21 12v3" />
    </svg>
  );
}

export function MergeIcon(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </svg>
  );
}

export function BrainIcon(p: IconProps = {}) {
  return (
    <svg {...iconProps(p)}>
      <path d="M9 4a3 3 0 0 0-3 3v.4A3 3 0 0 0 4 10.5v.5a3 3 0 0 0 .8 2A3 3 0 0 0 6 18.5 3 3 0 0 0 9 21a3 3 0 0 0 3-3V4a2 2 0 0 0-2 0H9z" />
      <path d="M15 4a3 3 0 0 1 3 3v.4a3 3 0 0 1 2 3.1v.5a3 3 0 0 1-.8 2 3 3 0 0 1-1.2 5.5A3 3 0 0 1 15 21a3 3 0 0 1-3-3V4a2 2 0 0 1 2 0h1z" />
    </svg>
  );
}

export const DecisionIcon: Record<TagKey, (p?: IconProps) => React.JSX.Element> = {
  drop: TrashIcon,
  automate: BotIcon,
  hybrid: MergeIcon,
  own: BrainIcon,
};
