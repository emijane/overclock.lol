import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  maxWidthClassName?: string;
};

const baseClassName = "mx-auto w-full";

export function PageContainer({
  children,
  className = "",
  maxWidthClassName = "max-w-[68rem]",
}: PageContainerProps) {
  const resolvedClassName = [baseClassName, maxWidthClassName, className]
    .filter(Boolean)
    .join(" ");

  return <div className={resolvedClassName}>{children}</div>;
}
