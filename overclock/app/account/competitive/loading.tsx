import { PageContainer } from "@/app/components/page-container";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

export default function Loading() {
  return (
    <main className="relative flex-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-68 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-64 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
      />
      <PageContainer
        className="relative z-10 flex flex-col gap-3"
        maxWidthClassName="max-w-4xl"
      >
        <section className="rounded-[28px]">
          <div className="overflow-hidden rounded-[28px]">
            <header className="px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <SkeletonBlock className="h-3 w-20 rounded-full" />
                  <SkeletonBlock className="h-10 w-64 rounded-[18px]" />
                </div>
                <SkeletonBlock className="h-9 w-28 rounded-full" />
              </div>
            </header>

            <div className="rounded-[28px] border border-white/[0.08] bg-[#05070b] shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/5">
              <section className="border-t border-white/10 px-5 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SkeletonBlock className="h-8 w-24 rounded-[14px]" />
                    <SkeletonBlock className="h-4 w-32" />
                  </div>
                  <SkeletonBlock className="h-8 w-16 rounded-full" />
                </div>
              </section>

              <section className="border-t border-white/10 px-5 py-4 sm:px-6 sm:py-5">
                <div className="grid items-stretch gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((card) => (
                    <div
                      key={card}
                      className="rounded-[16px] border border-white/10 bg-[#05070b] p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <SkeletonBlock className="h-4 w-20" />
                          <SkeletonBlock className="h-3 w-24" />
                        </div>
                        <SkeletonBlock className="h-6 w-16 rounded-full" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                        <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                        <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-t border-white/10 px-5 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SkeletonBlock className="h-5 w-20" />
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className="h-7 w-24 rounded-full" />
                    <SkeletonBlock className="h-7 w-18 rounded-full" />
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <SkeletonBlock className="h-9 w-full rounded-[14px]" />
                    <SkeletonBlock className="h-9 w-full rounded-[14px]" />
                  </div>
                  <div>
                    <SkeletonBlock className="h-4 w-24" />
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {[0, 1, 2, 3, 4, 5].map((hero) => (
                        <SkeletonBlock
                          key={hero}
                          className="h-[52px] w-full rounded-[14px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <SkeletonBlock className="h-7 w-16 rounded-full" />
                </div>
              </section>
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
