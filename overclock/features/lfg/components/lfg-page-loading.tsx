import { PageContainer } from "@/components/app-shell/page-container";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

type LFGPageLoadingTone = "default" | "duos";

export function LFGPageLoading({
  breadcrumb = false,
  composerCta = false,
  composerOnly = false,
  feedLoading = "cards",
  helperText,
  showDescription = true,
  tone = "default",
  title,
}: {
  breadcrumb?: boolean;
  composerCta?: boolean;
  composerOnly?: boolean;
  feedLoading?: "cards" | "none";
  helperText?: string;
  showDescription?: boolean;
  tone?: LFGPageLoadingTone;
  title: string;
}) {
  const usesDuosTone = tone === "duos";

  return (
    <main
      className={`relative px-4 text-zinc-100 sm:px-6 ${
        composerOnly
          ? "flex min-h-0 flex-col pb-0 pt-2 sm:pt-3"
          : "flex min-h-0 flex-1 flex-col py-5 sm:py-7"
      }`}
    >
      {usesDuosTone ? (
        <>
          <div aria-hidden="true" className="oc-atmosphere-bg pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />
        </>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-68 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-64 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]"
          />
        </>
      )}
      <PageContainer
        className={`relative z-10 flex ${composerOnly ? "flex-col gap-2" : "min-h-full flex-1 flex-col gap-4"}`}
        maxWidthClassName={
          composerOnly ? "max-w-4xl" : usesDuosTone ? "max-w-[98rem]" : "max-w-[96rem]"
        }
      >
        <section
          className={
            usesDuosTone
              ? "flex min-h-full flex-1 flex-col oc-profile-shell rounded-[12px] bg-[#111111] p-px"
              : "flex min-h-full flex-1 flex-col rounded-[28px]"
          }
        >
          <div
            className={
              usesDuosTone
                ? "flex min-h-full flex-1 flex-col overflow-hidden rounded-[11px] bg-[#090909]"
                : "flex min-h-full flex-1 flex-col overflow-hidden rounded-[28px]"
            }
          >
            <header
              className={`px-5 sm:px-6 ${
                composerOnly ? "py-3 sm:py-4" : usesDuosTone ? "py-4 sm:py-5" : "py-5 sm:py-6"
              }`}
            >
              <div className={composerCta ? "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" : undefined}>
                <div>
                  {breadcrumb ? (
                    <SkeletonBlock className="h-3 w-24 rounded-full" />
                  ) : null}
                  <h1
                    className={`${breadcrumb ? "mt-3" : ""} ${
                      usesDuosTone
                        ? "oc-profile-display text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-zinc-50 sm:text-[40px]"
                        : `font-semibold tracking-[-0.04em] text-zinc-50 ${
                            composerOnly ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
                          }`
                    }`}
                  >
                    {title}
                  </h1>
                  {showDescription ? (
                    <>
                      <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
                      <SkeletonBlock className="mt-2 h-4 w-full max-w-xl" />
                    </>
                  ) : null}
                  {helperText ? (
                    <SkeletonBlock className="mt-2 h-4 w-full max-w-lg" />
                  ) : null}
                </div>
                {composerCta ? (
                  <SkeletonBlock className="h-9 w-28 shrink-0 rounded-full" />
                ) : null}
              </div>

              {composerOnly ? (
                <section className="mt-4">
                  <div className="oc-surface-panel rounded-[24px] px-4 py-4 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <SkeletonBlock className="h-4 w-20" />
                      <div className="flex items-center gap-2">
                        <SkeletonBlock className="h-8 w-24 rounded-full" />
                        <SkeletonBlock className="h-8 w-28 rounded-full" />
                      </div>
                    </div>
                    <SkeletonBlock className="mt-2 h-[54px] w-full rounded-[18px]" />

                    <SkeletonBlock className="mt-4 h-4 w-16" />
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <SkeletonBlock className="h-[56px] w-full rounded-[16px]" />
                      <SkeletonBlock className="h-[56px] w-full rounded-[16px]" />
                    </div>

                    <SkeletonBlock className="mt-4 h-4 w-10" />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <SkeletonBlock className="h-8 w-20 rounded-full" />
                      <SkeletonBlock className="h-8 w-18 rounded-full" />
                      <SkeletonBlock className="h-8 w-24 rounded-full" />
                    </div>

                    <SkeletonBlock className="mt-4 h-4 w-20" />
                    <SkeletonBlock className="mt-2 h-3 w-44" />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <SkeletonBlock className="h-8 w-20 rounded-full" />
                      <SkeletonBlock className="h-8 w-18 rounded-full" />
                      <SkeletonBlock className="h-8 w-24 rounded-full" />
                      <SkeletonBlock className="h-8 w-14 rounded-full border border-dashed border-white/10 bg-white/[0.03]" />
                    </div>
                  </div>
                </section>
              ) : null}
            </header>

            {composerOnly ? null : (
              <div className="flex min-h-0 flex-1 flex-col">
                  {composerCta ? (
                  <section className="px-5 py-1.5 sm:px-6 sm:py-2">
                    <div className="mb-4">
                      <div className={`flex items-center gap-3 px-4 py-3 ${
                        usesDuosTone
                          ? "rounded-[12px] border border-white/[0.06] bg-white/[0.02]"
                          : "rounded-[18px] border border-white/[0.07] bg-[#05070b] shadow-[0_16px_36px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.04)]"
                      }`}>
                        <SkeletonBlock className="h-9 w-9 rounded-full" />
                        <SkeletonBlock className="h-4 w-full max-w-md" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <SkeletonBlock className="h-7.5 w-22 rounded-full" />
                        <SkeletonBlock className="h-7.5 w-22 rounded-full" />
                        <SkeletonBlock className="h-7.5 w-22 rounded-full" />
                        <SkeletonBlock className="h-7.5 w-24 rounded-full" />
                      </div>
                      <SkeletonBlock className="h-3.5 w-28" />
                    </div>
                  </section>
                ) : (
                  <section className="border-t border-white/10 px-5 py-5 sm:px-6">
                    <div className="rounded-[18px] border border-dashed border-white/12 bg-[#05070b] px-4 py-4">
                      <SkeletonBlock className="h-4 w-20" />
                      <SkeletonBlock className="mt-3 h-4 w-full max-w-md" />
                    </div>
                  </section>
                )}

                <section className="flex-1 border-t border-white/10 px-5 py-5 sm:px-6 sm:py-6">
                  {feedLoading === "cards" ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {[0, 1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="overflow-hidden rounded-[22px] border border-[#12161d] bg-[#05070b] shadow-[0_16px_36px_rgba(0,0,0,0.26)]"
                        >
                          <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[21px] bg-[#05070b] ring-1 ring-white/[0.05]">
                            <SkeletonBlock className="h-20 w-full rounded-none bg-white/[0.05]" />
                            <div className="relative flex flex-1 flex-col px-4 pb-3.5 pt-2">
                              <div className="absolute left-4 top-0">
                                <SkeletonBlock className="h-[84px] w-[84px] rounded-full border-[3px] border-[#05070b] bg-white/[0.08]" />
                              </div>
                              <div className="absolute right-4 top-2.5 flex flex-col items-end gap-1">
                                <SkeletonBlock className="h-6 w-20 rounded-full" />
                                <SkeletonBlock className="h-3 w-14" />
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
                              <div className="mt-auto flex gap-2 pt-3">
                                <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                                <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                                <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              </div>
            )}
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
