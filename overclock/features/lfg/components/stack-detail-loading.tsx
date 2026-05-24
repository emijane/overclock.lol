import { PageContainer } from "@/components/app-shell/page-container";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

export function StackDetailLoading() {
  return (
    <main className="oc-atmosphere-bg relative flex-1 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />

      <PageContainer className="relative z-10 flex flex-col gap-4" maxWidthClassName="max-w-[59rem]">
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-3 w-16 rounded-full" />

          <section className="rounded-[10px] border border-white/6 bg-white/2">
            <div className="relative h-24 overflow-hidden rounded-t-[9px] border-b border-white/6 bg-zinc-950/95 sm:h-25">
              <SkeletonBlock className="h-full w-full rounded-none bg-white/[0.04]" />
              <div className="absolute right-4 top-3 flex items-center gap-2 sm:right-5">
                <SkeletonBlock className="h-7 w-7 rounded-[10px]" />
                <SkeletonBlock className="h-7 w-22 rounded-[10px]" />
              </div>
            </div>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="mb-2.5 flex min-w-0 items-end gap-3 pt-0.5">
                <SkeletonBlock className="-mt-[3rem] h-[68px] w-[68px] rounded-full bg-white/[0.08]" />
              </div>

              <div className="space-y-2">
                <SkeletonBlock className="h-6 w-full max-w-[22rem]" />
                <SkeletonBlock className="h-3.5 w-full max-w-[18rem]" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <SkeletonBlock className="h-7 w-18 rounded-full" />
                <SkeletonBlock className="h-7 w-22 rounded-full" />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-7 w-30 rounded-full" />
              </div>
            </div>
          </section>

          <section className="rounded-[10px] border border-white/6 bg-white/2">
            <div className="px-4 py-4 sm:px-5 sm:py-4.5">
              <SkeletonBlock className="mb-3 h-3 w-28" />
              <div className="space-y-2.5">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-white/5 bg-black/12 px-4 py-3"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <SkeletonBlock className="h-10 w-10 rounded-full bg-white/[0.08]" />
                      <div className="space-y-2">
                        <SkeletonBlock className="h-4 w-28" />
                        <SkeletonBlock className="h-3 w-20" />
                      </div>
                    </div>
                    <SkeletonBlock className="h-8 w-16 rounded-[10px]" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[10px] border border-white/6 bg-white/2">
            <div className="px-4 py-4 sm:px-5 sm:py-4.5">
              <div className="mb-3 flex items-center gap-2">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-5 w-8 rounded-full" />
              </div>
              <div className="space-y-2.5">
                <SkeletonBlock className="h-16 w-full rounded-[10px]" />
                <SkeletonBlock className="h-16 w-full rounded-[10px]" />
              </div>
            </div>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}
