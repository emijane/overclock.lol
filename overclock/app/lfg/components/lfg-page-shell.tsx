import { FilterIcon, MessageSquarePlusIcon, SearchIcon } from "lucide-react";

type LFGPageShellProps = {
  description: string;
  title: string;
};

function LFGFiltersBar() {
  return (
    <section className="border-t border-white/10 px-5 py-5 sm:px-6">
      <div className="flex min-h-16 flex-col justify-center rounded-[18px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-zinc-400">
            <FilterIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Filters</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Competitive, Unranked, role, rank, region, platform, LFG, and LFD filters will live here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function LFGFeedPlaceholder() {
  return (
    <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
      <div className="grid min-h-[280px] place-items-center rounded-[20px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-10 text-center">
        <div className="max-w-sm">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-zinc-400">
            <SearchIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-zinc-100">
            Feed placeholder
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Posts for this community will render here once the posting system is connected.
          </p>
        </div>
      </div>
    </section>
  );
}

export function LFGPageShell({
  description,
  title,
}: LFGPageShellProps) {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-7">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.025] p-px shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="overflow-hidden rounded-[27px] bg-zinc-950">
            <header className="px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Community
              </p>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-3xl">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    {description}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-zinc-100"
                >
                  <MessageSquarePlusIcon className="h-4 w-4" />
                  Create Post
                </button>
              </div>

            </header>

            <LFGFiltersBar />
            <LFGFeedPlaceholder />
          </div>
        </section>
      </div>
    </main>
  );
}
