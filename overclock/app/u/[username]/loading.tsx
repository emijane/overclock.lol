import { AuthenticatedWorkspaceShell } from "@/components/app-shell/authenticated-workspace-shell";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

export default function Loading() {
  return (
    <AuthenticatedWorkspaceShell centerClassName="w-full max-w-4xl">
      <div className="grid w-full gap-2.5">
        <div className="flex flex-1 flex-col overflow-clip rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] sm:shadow-none">
          <div className="flex w-full min-w-0 flex-1 flex-col overflow-hidden bg-transparent sm:rounded-[10px]">
            <section className="bg-transparent">
              <div className="pb-4 sm:pb-5">
                <div
                  className="relative overflow-hidden px-4 py-3 sm:px-6"
                  style={{ aspectRatio: "3.4 / 1" }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-b from-[#0a0b10] via-[#07080d] to-[#05070b]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#090909] via-[#090909]/60 to-transparent"
                  />
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <SkeletonBlock className="h-6 w-26 rounded-[10px] bg-black/70" />
                    <div className="flex items-start gap-1.5">
                      <SkeletonBlock className="h-6 w-16 rounded-[10px] bg-black/70" />
                      <SkeletonBlock className="h-6 w-16 rounded-[10px] bg-black/70" />
                      <SkeletonBlock className="h-6 w-18 rounded-[10px] bg-black/70" />
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none relative z-20 -mt-[3.25rem] px-4 sm:-mt-[3.75rem] sm:px-6">
                  <div className="pointer-events-auto w-fit">
                    <SkeletonBlock className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
                  </div>
                </div>

                <div className="mt-4 px-4 sm:-mt-9 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div aria-hidden="true" className="h-3 sm:h-14" />
                      <div className="flex flex-wrap items-center gap-2">
                        <SkeletonBlock className="h-8 w-44" />
                        <SkeletonBlock className="h-7 w-7 rounded-full" />
                      </div>
                      <SkeletonBlock className="mt-1.5 h-4 w-40" />
                      <SkeletonBlock className="mt-3 h-5 w-full max-w-xl" />
                      <SkeletonBlock className="mt-2 h-5 w-full max-w-lg" />
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <SkeletonBlock className="h-6 w-28 rounded-[10px]" />
                      </div>
                    </div>

                    <div className="sm:min-w-[220px] sm:-mt-6">
                      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                        <SkeletonBlock className="h-8 w-24 rounded-[10px]" />
                        <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                        <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                        <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t border-white/[0.04] px-5 pb-3 pt-2.5 sm:px-6 sm:pb-4 sm:pt-3">
              <div className="flex items-center justify-between gap-3">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-7 w-7 rounded-[10px]" />
              </div>
              <div className="mt-3 grid gap-2.5 lg:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="oc-card-lift rounded-[10px] p-3">
                    <SkeletonBlock className="h-5 w-24" />
                    <SkeletonBlock className="mt-2 h-4 w-20" />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                      <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                      <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-white/[0.04] px-5 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-7 w-7 rounded-[10px]" />
              </div>
              <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                {[0, 1].map((item) => (
                  <div key={item} className="group oc-card-lift overflow-hidden rounded-[10px]">
                    <SkeletonBlock className="aspect-video w-full rounded-none" />
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-white/[0.04] px-5 pb-3 pt-2.5 sm:px-6 sm:pb-4 sm:pt-3">
              <SkeletonBlock className="h-4 w-24" />
              <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                {[0, 1].map((item) => (
                  <div key={item} className="oc-card-lift rounded-[10px] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <SkeletonBlock className="h-5 w-full max-w-xs" />
                        <SkeletonBlock className="mt-3 h-4 w-40" />
                      </div>
                      <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AuthenticatedWorkspaceShell>
  );
}
