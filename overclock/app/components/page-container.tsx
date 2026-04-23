import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

const baseClassName = "mx-auto w-full max-w-[58rem]";

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  const resolvedClassName = className
    ? `${baseClassName} ${className}`
    : baseClassName;

  return <div className={resolvedClassName}>{children}</div>;
}
