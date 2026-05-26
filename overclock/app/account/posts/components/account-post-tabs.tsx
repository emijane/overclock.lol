import Link from "next/link";

import type { LFGPostDisplayStatus } from "@/lib/lfg/lfg-post-display-status";

type TabValue = "all" | LFGPostDisplayStatus;

type AccountPostTabsProps = {
  counts: Record<TabValue, number>;
  selectedStatus: TabValue;
};

const TABS: { label: string; value: TabValue }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Closed", value: "closed" },
  { label: "Expired", value: "expired" },
];

export function AccountPostTabs({ counts, selectedStatus }: AccountPostTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_100%)] px-4 py-3 sm:px-5">
      {TABS.map(({ label, value }) => {
        const isActive = selectedStatus === value;
        const count = counts[value];
        const href = value === "all" ? "/account/posts" : `/account/posts?status=${value}`;

        return (
          <Link
            key={value}
            href={href}
            className={`oc-profile-display inline-flex h-8 items-center gap-1.5 rounded-[10px] border px-3 text-[12px] font-semibold transition ${
              isActive
                ? "border-white/[0.08] bg-white/[0.06] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "border-transparent text-zinc-500 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-zinc-300"
            }`}
          >
            {label}
            {count > 0 ? (
              <span
                className={`oc-profile-meta text-[11px] tabular-nums ${
                  isActive ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
