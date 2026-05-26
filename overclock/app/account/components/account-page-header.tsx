import type { ReactNode } from "react";

type AccountPageHeaderProps = {
  actions?: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

export function AccountPageHeader({
  actions,
  description,
  eyebrow = "Account settings",
  title,
}: AccountPageHeaderProps) {
  return (
    <header className="relative mb-3 overflow-hidden rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_30%,rgba(5,7,11,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_72%)]"
      />
      <div className="relative flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-4">
        <div className="max-w-2xl space-y-2">
          <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
            {eyebrow}
          </p>
          <h1 className="oc-profile-display text-[20px] font-bold tracking-[-0.03em] text-zinc-50 sm:text-[24px]">
            {title}
          </h1>
          <p className="max-w-xl text-[11px] leading-5 text-zinc-400 sm:text-[12px] sm:leading-5">
            {description}
          </p>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
