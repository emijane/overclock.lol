import type { ReactNode } from "react";

type PageRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: 0 | 1 | 2;
  disabled?: boolean;
};

export function PageReveal({
  children,
  className,
  delay = 0,
  disabled = false,
}: PageRevealProps) {
  const revealClassName = disabled
    ? ""
    : delay === 2
      ? "page-enter page-enter-delay-2"
      : delay === 1
        ? "page-enter page-enter-delay-1"
        : "page-enter";
  const resolvedClassName = [revealClassName, className].filter(Boolean).join(" ");

  return <div className={resolvedClassName}>{children}</div>;
}
