import type { ReactNode } from "react";

type PageRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: 0 | 1 | 2;
  disabled?: boolean;
  variant?: "fade" | "lift";
};

export function PageReveal({
  children,
  className,
  delay = 0,
  disabled = false,
  variant = "lift",
}: PageRevealProps) {
  const revealClassName = disabled
    ? ""
    : delay === 2
      ? `${variant === "fade" ? "page-fade-enter" : "page-enter"} page-enter-delay-2`
      : delay === 1
        ? `${variant === "fade" ? "page-fade-enter" : "page-enter"} page-enter-delay-1`
        : variant === "fade"
          ? "page-fade-enter"
          : "page-enter";
  const resolvedClassName = [revealClassName, className].filter(Boolean).join(" ");

  return <div className={resolvedClassName}>{children}</div>;
}
