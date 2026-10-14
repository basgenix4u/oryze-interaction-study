import type { SVGProps } from "react";
import { oryzeTokens } from "@/lib/tokens";

type RingSegment = {
  start: number;
  end: number;
  color: "majorelle" | "rose" | "lavender";
};

type OryzeRingProps = {
  progress?: number;
  size?: number;
  variant?: "full" | "outline";
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "width" | "height" | "viewBox" | "children">;

const { centerX, centerY, outerRadius, innerRadius, topGapDegrees, leftGapDegrees, bottomGapDegrees, viewBox } = oryzeTokens.ring;
const topHalfGap = topGapDegrees / 2;
const leftHalfGap = leftGapDegrees / 2;
const bottomHalfGap = bottomGapDegrees / 2;

// Four radial-edged wedges. The two right-hand wedges meet without a seam,
// matching the single continuous majorelle sweep in the production PNG.
const segments: readonly RingSegment[] = [
  { start: topHalfGap, end: 90, color: "majorelle" },
  { start: 90, end: 180 - bottomHalfGap, color: "majorelle" },
  { start: 180 + bottomHalfGap, end: 270 - leftHalfGap, color: "rose" },
  { start: 270 + leftHalfGap, end: 360 - topHalfGap, color: "lavender" },
];
const totalSpan = segments.reduce((sum, segment) => sum + segment.end - segment.start, 0);

function pointAt(radius: number, angle: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.sin(radians),
    y: centerY - radius * Math.cos(radians),
  };
}

function format(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function wedgePath(start: number, end: number): string {
  if (end <= start) return "";

  const outerStart = pointAt(outerRadius, start);
  const outerEnd = pointAt(outerRadius, end);
  const innerEnd = pointAt(innerRadius, end);
  const innerStart = pointAt(innerRadius, start);

  return [
    `M ${format(outerStart.x)} ${format(outerStart.y)}`,
    `A ${outerRadius} ${outerRadius} 0 0 1 ${format(outerEnd.x)} ${format(outerEnd.y)}`,
    `L ${format(innerEnd.x)} ${format(innerEnd.y)}`,
    `A ${innerRadius} ${innerRadius} 0 0 0 ${format(innerStart.x)} ${format(innerStart.y)}`,
    "Z",
  ].join(" ");
}

function getProgressPaths(progress: number): Array<{ color: RingSegment["color"]; path: string }> {
  let remaining = Math.min(1, Math.max(0, progress)) * totalSpan;

  return segments.flatMap((segment) => {
    const span = segment.end - segment.start;
    const visibleSpan = Math.min(span, Math.max(0, remaining));
    remaining = Math.max(0, remaining - span);

    if (visibleSpan < 0.01) return [];
    return [{ color: segment.color, path: wedgePath(segment.start, segment.start + visibleSpan) }];
  });
}

export function OryzeRing({
  progress = 0,
  size = 1000,
  variant = "full",
  className,
  ...svgProps
}: OryzeRingProps) {
  const baseOpacity = variant === "outline" ? 0.28 : 1;
  const progressPaths = getProgressPaths(progress);
  const classes = ["oryze-ring", className].filter(Boolean).join(" ");

  return (
    <svg
      aria-hidden="true"
      className={classes}
      focusable="false"
      height={size}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      width={size}
      {...svgProps}
    >
      <g fillOpacity={baseOpacity}>
        {segments.map((segment, index) => (
          <path
            d={wedgePath(segment.start, segment.end)}
            fill={`var(--oryze-${segment.color})`}
            key={`${segment.color}-${index}`}
          />
        ))}
      </g>
      <g>
        {progressPaths.map((segment, index) => (
          <path d={segment.path} fill={`var(--oryze-${segment.color})`} key={`progress-${index}`} />
        ))}
      </g>
    </svg>
  );
}
