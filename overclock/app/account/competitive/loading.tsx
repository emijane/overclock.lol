function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

export default function Loading() {
  return (
    <>
      <section className="mb-3 rounded-[24px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.008)_100%)] px-5 py-4 shadow-[0_18px_44px_rgba(0,0,0,0.18)] sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="h-10 w-64 rounded-[18px]" />
            <SkeletonBlock className="h-4 w-80 max-w-full" />
          </div>
          <SkeletonBlock className="h-8 w-24 rounded-[10px]" />
        </div>
      </section>

      <section className="oc-surface-panel overflow-hidden rounded-[24px]">
        <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6 sm:py-5">
          <SkeletonBlock className="h-6 w-28" />
          <SkeletonBlock className="mt-2 h-4 w-[26rem] max-w-full" />
        </div>

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
      </section>
    </>
  );
}
