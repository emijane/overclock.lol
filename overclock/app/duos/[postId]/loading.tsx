import { PageContainer } from "@/components/app-shell/page-container";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

export default function Loading() {
  return (
    <main className="oc-atmosphere-bg relative flex-1 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />

      <PageContainer className="relative z-10 flex flex-col gap-4" maxWidthClassName="max-w-[48rem]">
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-3 w-14 rounded-full" />

          <section className="rounded-[10px] border border-white/6 bg-white/2">
            <div className="relative h-24 overflow-hidden rounded-t-[9px] border-b border-white/6 bg-zinc-950/95 sm:h-25">
              <SkeletonBlock className="h-full w-full rounded-none bg-white/[0.04]" />
              <div className="absolute right-4 top-3 flex items-center gap-2 sm:right-5">
                <SkeletonBlock className="h-7 w-28 rounded-[10px]" />
              </div>
            </div>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="mb-2.5 flex min-w-0 items-end gap-3 pt-0.5">
                <SkeletonBlock className="-mt-[3rem] h-[68px] w-[68px] rounded-full bg-white/[0.08]" />
              </div>

              <div className="space-y-2">
                <SkeletonBlock className="h-6 w-full max-w-[22rem]" />
                <SkeletonBlock className="h-3.5 w-full max-w-[16rem]" />
                <SkeletonBlock className="h-3.5 w-full max-w-[10rem]" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <SkeletonBlock className="h-7 w-14 rounded-full" />
                <SkeletonBlock className="h-7 w-18 rounded-full" />
              </div>

              <div className="mt-4 flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} className="h-9 w-9 rounded-[8px]" />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span />
                <SkeletonBlock className="h-7 w-20 rounded-[10px]" />
              </div>
            </div>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}
