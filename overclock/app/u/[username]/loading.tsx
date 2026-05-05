function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

export default function Loading() {
  return (
    <main className="flex-1 bg-transparent px-4 py-5 text-[15px] text-zinc-100 sm:px-6 sm:py-7">
      <div className="mx-auto grid w-full max-w-4xl gap-3">
        <div className="rounded-[28px] bg-white/10 p-px shadow-[0_0_24px_rgba(255,255,255,0.06)]">
          <div className="overflow-hidden rounded-[27px] bg-[#05070b] ring-1 ring-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <section className="bg-[#05070b]">
              <div className="pb-6 sm:pb-7">
                <div className="relative overflow-hidden px-4 py-4 sm:px-6">
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-[#0a0b10] via-[#07080d] to-[#05070b]"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#05070b] via-[#05070b]/70 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <SkeletonBlock className="h-8 w-28 rounded-full" />
                    <div className="flex items-start gap-1.5">
                      <SkeletonBlock className="h-8 w-28 rounded-full" />
                      <SkeletonBlock className="h-8 w-28 rounded-full" />
                    </div>
                  </div>
                  <div className="aspect-[3.4/1]" />
                </div>

                <div className="pointer-events-none relative z-20 -mt-14 px-4 sm:-mt-16 sm:px-6">
                  <div className="pointer-events-auto w-fit">
                    <SkeletonBlock className="h-28 w-28 rounded-full sm:h-32 sm:w-32" />
                  </div>
                </div>

                <div className="mt-7 px-4 sm:-mt-10 sm:px-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="sm:h-14" aria-hidden="true" />
                      <div className="flex flex-wrap items-center gap-2.5">
                        <SkeletonBlock className="h-8 w-36" />
                        <SkeletonBlock className="h-7 w-7 rounded-full" />
                      </div>
                      <SkeletonBlock className="mt-2 h-5 w-20" />
                      <SkeletonBlock className="mt-3 h-5 w-full max-w-xl" />
                      <SkeletonBlock className="mt-2 h-5 w-full max-w-lg" />
                    </div>

                    <div className="sm:min-w-[220px]">
                      <div className="flex items-center justify-end gap-2">
                        <SkeletonBlock className="h-8 w-24 rounded-full" />
                        <SkeletonBlock className="h-8 w-8 rounded-full" />
                        <SkeletonBlock className="h-8 w-8 rounded-full" />
                        <SkeletonBlock className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5 px-4 sm:px-6">
                  <SkeletonBlock className="h-8 w-40 rounded-full" />
                  <SkeletonBlock className="h-8 w-16 rounded-full" />
                  <SkeletonBlock className="h-8 w-20 rounded-full" />
                  <SkeletonBlock className="h-8 w-14 rounded-full" />
                  <SkeletonBlock className="h-8 w-16 rounded-full" />
                </div>
              </div>
            </section>

            <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center justify-between gap-3">
                <SkeletonBlock className="h-5 w-28" />
                <SkeletonBlock className="h-8 w-8 rounded-full" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.02]"
                  >
                    <SkeletonBlock className="aspect-video w-full rounded-none" />
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center justify-between gap-3">
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="h-8 w-8 rounded-full" />
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-white/10 bg-[#05070b] p-3.5"
                  >
                    <SkeletonBlock className="h-4 w-20" />
                    <SkeletonBlock className="mt-2 h-3 w-16" />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <SkeletonBlock className="h-8 w-8 rounded-[9px]" />
                      <SkeletonBlock className="h-8 w-8 rounded-[9px]" />
                      <SkeletonBlock className="h-8 w-8 rounded-[9px]" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
              <SkeletonBlock className="h-5 w-24" />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[0, 1].map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-white/10 bg-[#05070b] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <SkeletonBlock className="h-5 w-full max-w-xs" />
                        <SkeletonBlock className="mt-3 h-4 w-40" />
                      </div>
                      <SkeletonBlock className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
