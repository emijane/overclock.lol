"use client";

import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";

import type { LFGPostDisplayStatus } from "@/lib/lfg/lfg-post-display-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AccountPostStatusFilterValue = "all" | LFGPostDisplayStatus;

const filterLabelMap: Record<AccountPostStatusFilterValue, string> = {
  active: "Active",
  all: "All Posts",
  closed: "Closed",
  expired: "Expired",
};

type AccountPostStatusFilterProps = {
  selectedStatus: AccountPostStatusFilterValue;
};

export function AccountPostStatusFilter({
  selectedStatus,
}: AccountPostStatusFilterProps) {
  const options: AccountPostStatusFilterValue[] = [
    "all",
    "active",
    "closed",
    "expired",
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.045] hover:text-zinc-50"
        >
          {filterLabelMap[selectedStatus]}
          <ChevronDownIcon className="h-4 w-4 text-zinc-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-44 border border-white/10 bg-zinc-950 text-zinc-100"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            asChild
            className={
              option === selectedStatus
                ? "text-zinc-50 focus:bg-white/[0.04]"
                : "text-zinc-400 focus:bg-white/[0.04] focus:text-zinc-100"
            }
          >
            <Link href={option === "all" ? "/account/posts" : `/account/posts?status=${option}`}>
              {filterLabelMap[option]}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
