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
    <div className="flex items-center gap-0.5 border-b border-white/6 px-3 py-2 sm:px-4">
      {TABS.map(({ label, value }) => {
        const isActive = selectedStatus === value;
        const count = counts[value];
        const href = value === "all" ? "/account/posts" : `/account/posts?status=${value}`;

        return (
          <Link
            key={value}
            href={href}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition ${
              isActive
                ? "bg-white/8 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {label}
            {count > 0 ? (
              <span
                className={`text-[12px] tabular-nums ${
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
