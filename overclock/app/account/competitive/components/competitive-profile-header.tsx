import Link from "next/link";
import { ChevronLeftIcon, PlusIcon } from "lucide-react";

export function CompetitiveProfileHeader() {
  return (
    <header className="py-4 sm:py-5">
      <div className="space-y-2.5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 transition hover:text-zinc-300"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
              Account
            </Link>
            <h1 className="text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
              Competitive profile
            </h1>
          </div>
          <Link
            href="/duos/create"
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 self-start rounded-full border border-white/[0.14] bg-[#262626] px-3.5 text-sm font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#303030] hover:text-white"
          >
            <PlusIcon className="h-4 w-4" />
            Create Post
          </Link>
        </div>
      </div>
    </header>
  );
}
