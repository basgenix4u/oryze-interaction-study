import type { ReactNode } from "react";

type StatusBadgeProps = {
  children: ReactNode;
  variant?: "butter" | "mint" | "neutral";
  className?: string;
};

export function StatusBadge({ children, variant = "neutral", className }: StatusBadgeProps) {
  const classes = ["status-badge", `status-badge--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
