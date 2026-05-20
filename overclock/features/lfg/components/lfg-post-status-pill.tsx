import type { LFGPostDisplayStatus } from "@/lib/lfg/lfg-post-display-status";

const statusLabelMap: Record<LFGPostDisplayStatus, string> = {
  active: "Active",
  closed: "Closed",
  expired: "Expired",
};

const statusClassNameMap: Record<LFGPostDisplayStatus, string> = {
  active: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
  closed: "border-white/10 bg-white/[0.04] text-zinc-300",
  expired: "border-amber-300/20 bg-amber-300/10 text-amber-100",
};

type LFGPostStatusPillProps = {
  status: LFGPostDisplayStatus;
};

export function LFGPostStatusPill({ status }: LFGPostStatusPillProps) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClassNameMap[status]}`}
    >
      {statusLabelMap[status]}
    </span>
  );
}
