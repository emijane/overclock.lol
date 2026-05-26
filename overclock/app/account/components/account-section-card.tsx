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
      className={`oc-surface-panel overflow-hidden rounded-[16px] border-white/[0.05] shadow-[0_16px_36px_rgba(0,0,0,0.2)] ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 border-b border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_100%)] px-5 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-3.5">
        <div className="max-w-2xl space-y-1.5">
          <h2 className="oc-profile-display text-[15px] font-semibold tracking-[-0.03em] text-zinc-50 sm:text-[16px]">
            {title}
          </h2>
          {description ? (
            <p className="text-[11px] leading-5 text-zinc-400 sm:text-[12px] sm:leading-5">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 self-start">{action}</div> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
