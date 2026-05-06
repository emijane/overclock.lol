"use client";

import Link from "next/link";
import { BellIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function GlobalNotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-zinc-100"
        >
          <BellIcon className="h-4.5 w-4.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[20rem] rounded-2xl border border-white/10 bg-[#05070b] p-3 text-zinc-100 shadow-[0_24px_70px_rgba(0,0,0,0.35)] ring-1 ring-white/5"
      >
        <div className="rounded-[16px] bg-white/[0.02] px-4 py-6 text-center">
          <p className="text-sm font-medium text-zinc-200">No pending invites</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            When someone invites you to play, it&apos;ll show up here.
          </p>
          <Link
            href="/matches"
            className="mt-4 inline-flex text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
          >
            Open matches
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
