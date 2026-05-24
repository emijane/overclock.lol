import { PageContainer } from "@/components/app-shell/page-container";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

function StackFeedCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#12161d] bg-[#05070b] shadow-[0_16px_36px_rgba(0,0,0,0.26)]">
      <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[21px] bg-[#05070b] ring-1 ring-white/[0.05]">
        <SkeletonBlock className="h-20 w-full rounded-none bg-white/[0.05]" />
        <div className="relative flex flex-1 flex-col px-4 pb-3.5 pt-2">
          <div className="absolute left-4 top-0">
            <SkeletonBlock className="h-[84px] w-[84px] rounded-full border-[3px] border-[#05070b] bg-white/[0.08]" />
          </div>
          <div className="absolute right-4 top-2.5 flex flex-col items-end gap-1">
            <SkeletonBlock className="h-6 w-22 rounded-full" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
          <div className="min-w-0 pt-8">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-2 h-3 w-16" />
          </div>
          <div className="mt-2 min-w-0">
            <SkeletonBlock className="h-4 w-full max-w-[16rem]" />
            <SkeletonBlock className="mt-2 h-4 w-full max-w-[13rem]" />
            <div className="mt-3 flex items-center gap-2">
              <SkeletonBlock className="h-4 w-4 rounded-full" />
              <SkeletonBlock className="h-3.5 w-28" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <SkeletonBlock className="h-7.5 w-18 rounded-full" />
            <SkeletonBlock className="h-7.5 w-18 rounded-full" />
            <SkeletonBlock className="h-7.5 w-18 rounded-full" />
          </div>
          <div className="mt-auto flex gap-2 pt-3">
            <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
            <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
            <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StacksPageLoading() {
  return (
    <main className="oc-atmosphere-bg relative flex min-h-0 flex-1 flex-col px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />

      <PageContainer
        className="relative z-10 flex min-h-full flex-1 items-stretch gap-4 xl:gap-5"
        maxWidthClassName="max-w-none"
      >
        <aside className="hidden min-h-full w-56 shrink-0 self-stretch lg:block">
          <div className="h-full overflow-hidden rounded-[10px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] p-3">
            <SkeletonBlock className="h-8 w-28 rounded-[10px]" />
            <div className="mt-4 space-y-2.5">
              <SkeletonBlock className="h-9 w-full rounded-[10px]" />
              <SkeletonBlock className="h-9 w-full rounded-[10px]" />
              <SkeletonBlock className="h-9 w-full rounded-[10px]" />
            </div>
            <div className="mt-5 border-t border-white/[0.05] pt-4">
              <SkeletonBlock className="h-3 w-16" />
              <div className="mt-3 space-y-2">
                <SkeletonBlock className="h-8 w-full rounded-[10px]" />
                <SkeletonBlock className="h-8 w-full rounded-[10px]" />
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-h-full min-w-0 flex-1 flex-col">
          <div className="flex min-h-full flex-1 flex-col overflow-hidden rounded-[10px] bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)]">
            <header className="relative px-5 py-4 sm:px-6 sm:py-5">
              <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="oc-profile-display text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-zinc-50 sm:text-[40px]">
                      Stacks
                    </div>
                    <SkeletonBlock className="h-3.5 w-full max-w-md" />
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center gap-2.5 rounded-[10px] border border-white/[0.04] bg-white/[0.015] px-2.5 py-2">
                        <SkeletonBlock className="h-7 w-7 rounded-full" />
                        <SkeletonBlock className="h-4 w-full max-w-[24rem]" />
                      </div>
                      <SkeletonBlock className="h-3 w-40" />
                    </div>
                  </div>
                  <SkeletonBlock className="h-9 w-28 shrink-0 rounded-[10px]" />
                </div>
              </div>
              <SkeletonBlock className="absolute bottom-4 right-5 hidden h-3 w-24 sm:block" />
            </header>

            <div className="flex min-h-0 flex-1 flex-col border-t border-white/[0.03] bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)]">
              <section className="px-5 py-4 sm:px-6">
                <div className="rounded-[10px] border border-white/[0.04] bg-white/[0.015] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <SkeletonBlock className="h-3 w-24" />
                      <SkeletonBlock className="h-4 w-40" />
                      <SkeletonBlock className="h-3 w-52" />
                    </div>
                    <SkeletonBlock className="h-8 w-28 rounded-[10px]" />
                  </div>
                </div>
              </section>

              <div className="lg:hidden">
                <section className="px-5 pb-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <SkeletonBlock className="h-8 w-22 rounded-full" />
                    <SkeletonBlock className="h-8 w-24 rounded-full" />
                    <SkeletonBlock className="h-8 w-20 rounded-full" />
                    <SkeletonBlock className="h-8 w-24 rounded-full" />
                  </div>
                </section>
              </div>

              <section className="flex-1 border-t border-white/[0.03] px-5 py-5 sm:px-6 sm:py-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2, 3, 4, 5].map((item) => (
                    <StackFeedCardSkeleton key={item} />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
