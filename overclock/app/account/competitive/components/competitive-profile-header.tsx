import Link from "next/link";
import { PlusIcon } from "lucide-react";

export function CompetitiveProfileHeader() {
  return (
    <header className="px-5 py-4 sm:px-6 sm:py-5">
      <div className="space-y-2.5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-zinc-500">
              Account
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
              / Competitive
            </h1>
          </div>
          <Link
            href="/duos/create"
            className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-full border border-white/[0.14] bg-[#05070b] px-3.5 text-sm font-semibold text-zinc-100 transition-all duration-200 hover:border-white/[0.2] hover:bg-[#080b10] hover:text-white"
          >
            <PlusIcon className="h-4 w-4" />
            Create Post
          </Link>
        </div>
      </div>
    </header>
  );
}
