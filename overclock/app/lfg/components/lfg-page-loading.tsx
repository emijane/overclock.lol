import { PageContainer } from "@/app/components/page-container";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

export function LFGPageLoading({
  helperText,
  title,
}: {
  helperText?: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-zinc-100 sm:px-6 sm:py-7">
      <PageContainer className="flex flex-col gap-4">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.025] p-px shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="overflow-hidden rounded-[27px] bg-zinc-950">
            <header className="px-5 py-5 sm:px-6 sm:py-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-3xl">
                  {title}
                </h1>
                <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
                <SkeletonBlock className="mt-2 h-4 w-full max-w-xl" />
                {helperText ? (
                  <SkeletonBlock className="mt-2 h-4 w-full max-w-lg" />
                ) : null}
              </div>

              <section className="mt-6">
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-zinc-50">
                  Create a Post
                </h2>
                <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <SkeletonBlock className="h-4 w-40" />
                  <SkeletonBlock className="mt-3 h-11 w-full" />
                  <div className="mt-3 flex flex-wrap gap-3">
                    <SkeletonBlock className="h-11 w-24 rounded-full" />
                    <SkeletonBlock className="h-11 w-24 rounded-full" />
                    <SkeletonBlock className="h-11 w-28 rounded-full" />
                  </div>
                  <SkeletonBlock className="mt-4 h-32 w-full" />
                </div>
              </section>
            </header>

            <section className="border-t border-white/10 px-5 py-5 sm:px-6">
              <div className="rounded-[18px] border border-dashed border-white/12 bg-white/[0.02] px-4 py-4">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="mt-3 h-4 w-full max-w-md" />
              </div>
            </section>

            <section className="border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid gap-3">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <SkeletonBlock className="h-10 w-10 rounded-full" />
                          <div className="min-w-0 flex-1">
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="mt-2 h-3 w-24" />
                          </div>
                        </div>
                        <SkeletonBlock className="h-5 w-full max-w-sm" />
                        <SkeletonBlock className="mt-3 h-4 w-full max-w-xs" />
                      </div>
                      <SkeletonBlock className="h-9 w-9 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
