import type { ReactNode } from "react";

type AccountSectionCardProps = {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  description?: string;
  title: string;
};

export function AccountSectionCard({
  action,
  children,
  className = "",
  contentClassName = "",
  description,
  title,
}: AccountSectionCardProps) {
  return (
    <section
      className={`oc-surface-panel overflow-hidden rounded-[24px] ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
        <div className="max-w-2xl">
          <h2 className="oc-profile-display text-[17px] font-semibold tracking-[-0.03em] text-zinc-50">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-[13px] leading-6 text-zinc-400">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
