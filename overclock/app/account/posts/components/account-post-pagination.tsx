import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import type { LFGPostDisplayStatus } from "@/lib/lfg/lfg-post-display-status";

type TabValue = "all" | LFGPostDisplayStatus;

function buildHref(page: number, status: TabValue) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/account/posts${query ? `?${query}` : ""}`;
}

type AccountPostPaginationProps = {
  currentPage: number;
  selectedStatus: TabValue;
  totalPages: number;
};

export function AccountPostPagination({
  currentPage,
  selectedStatus,
  totalPages,
}: AccountPostPaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const btnBase =
    "inline-flex h-8 items-center gap-1 rounded-[10px] border border-white/[0.06] bg-white/[0.03] px-3 text-xs font-semibold text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-200";

  return (
    <div className="mt-4 grid grid-cols-3 items-center">
      <div>
        {hasPrev ? (
          <Link href={buildHref(currentPage - 1, selectedStatus)} className={btnBase}>
            <ChevronLeftIcon className="h-3 w-3" />
            Prev
          </Link>
        ) : null}
      </div>
      <p className="oc-profile-meta text-center text-[11px] tabular-nums text-zinc-500">
        {currentPage} / {totalPages}
      </p>
      <div className="flex justify-end">
        {hasNext ? (
          <Link href={buildHref(currentPage + 1, selectedStatus)} className={btnBase}>
            Next
            <ChevronRightIcon className="h-3 w-3" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
