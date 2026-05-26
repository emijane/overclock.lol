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
    <header className="mb-3 rounded-[24px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.008)_100%)] px-5 py-4 shadow-[0_18px_44px_rgba(0,0,0,0.18)] sm:px-6 sm:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="oc-profile-meta text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            {eyebrow}
          </p>
          <h1 className="oc-profile-display mt-1.5 text-[24px] font-bold tracking-[-0.04em] text-zinc-50 sm:text-[30px]">
            {title}
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-zinc-400">{description}</p>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
