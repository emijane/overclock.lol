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
    <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 px-5 py-2.5 sm:px-6">
      {TABS.map(({ label, value }) => {
        const isActive = selectedStatus === value;
        const count = counts[value];
        const href = value === "all" ? "/account/posts" : `/account/posts?status=${value}`;

        return (
          <Link
            key={value}
            href={href}
            className={`inline-flex h-7 items-center gap-1.5 rounded-[10px] border px-2.5 font-mono text-[11px] font-medium transition ${
              isActive
                ? "border-white/10 bg-white/[0.07] text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "border-white/6 bg-white/3 text-zinc-500 hover:border-white/10 hover:bg-white/6 hover:text-zinc-300"
            }`}
          >
            {label}
            {count > 0 ? (
              <span
                className={`tabular-nums ${isActive ? "text-zinc-400" : "text-zinc-600"}`}
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
