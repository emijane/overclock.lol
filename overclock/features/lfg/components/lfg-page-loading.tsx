import { AuthenticatedWorkspaceShell } from "@/components/app-shell/authenticated-workspace-shell";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

type LFGPageLoadingTone = "default" | "duos";
type LFGFeedLoadingVariant = "default" | "duos" | "stacks";

function DuosFeedCardSkeleton() {
  return (
    <div className="rounded-[12px] oc-card-lift">
      <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[11px] bg-transparent">
        <SkeletonBlock className="h-14 w-full rounded-none bg-white/[0.05]" />
        <div className="relative z-10 flex flex-1 flex-col px-3 pb-3 pt-2">
          <div className="absolute left-3 top-0">
            <SkeletonBlock className="-mt-[1.5rem] h-[48px] w-[48px] rounded-[10px] bg-white/[0.08]" />
          </div>
          <div className="absolute right-3 top-2 flex flex-wrap justify-end gap-1">
            <SkeletonBlock className="h-4.5 w-12 rounded-[5px]" />
            <SkeletonBlock className="h-4.5 w-14 rounded-[5px]" />
            <SkeletonBlock className="h-4.5 w-7 rounded-[5px]" />
          </div>

          <div className="min-w-0 pt-3.5">
            <div className="min-w-0 pt-2.5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-4 w-12 rounded-[6px]" />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <SkeletonBlock className="h-3.5 w-3.5 rounded-full" />
                <SkeletonBlock className="h-3 w-14" />
                <SkeletonBlock className="h-3 w-10" />
              </div>
            </div>
          </div>

          <div className="mt-1 min-w-0">
            <SkeletonBlock className="h-4 w-full max-w-[17rem]" />
            <SkeletonBlock className="mt-2 h-4 w-full max-w-[14rem]" />
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-2.5">
            <div className="flex flex-wrap gap-1.5">
              <SkeletonBlock className="h-8 w-8 rounded-[8px]" />
              <SkeletonBlock className="h-8 w-8 rounded-[8px]" />
              <SkeletonBlock className="h-8 w-8 rounded-[8px]" />
            </div>
            <SkeletonBlock className="h-7 w-22 shrink-0 rounded-[10px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StacksFeedCardSkeleton() {
  return (
    <div className="rounded-[12px] oc-card-lift">
      <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[11px] bg-transparent">
        <SkeletonBlock className="h-14 w-full rounded-none bg-white/[0.05]" />
        <div className="relative z-10 flex flex-1 flex-col px-3 pb-3 pt-2">
          <div className="absolute right-3 top-2 flex flex-wrap justify-end gap-1">
            <SkeletonBlock className="h-4.5 w-12 rounded-[5px]" />
            <SkeletonBlock className="h-4.5 w-16 rounded-[5px]" />
            <SkeletonBlock className="h-4.5 w-8 rounded-[5px]" />
          </div>

          <div className="min-w-0 pt-1.5">
            <SkeletonBlock className="-mt-[1.5rem] h-[48px] w-[48px] rounded-[10px] bg-white/[0.08]" />
            <div className="min-w-0 pt-1.5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-4 w-12 rounded-[6px]" />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <SkeletonBlock className="h-3.5 w-3.5 rounded-full" />
                <SkeletonBlock className="h-3 w-14" />
                <SkeletonBlock className="h-3 w-10" />
              </div>
            </div>
          </div>

          <div className="mt-1 min-w-0">
            <SkeletonBlock className="h-4 w-full max-w-[16rem]" />
            <SkeletonBlock className="mt-2 h-4 w-full max-w-[12rem]" />
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <SkeletonBlock className="h-4 w-16 rounded-[5px]" />
            <SkeletonBlock className="h-4 w-18 rounded-[5px]" />
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                <SkeletonBlock className="h-4.5 w-4.5 rounded-[6px]" />
                <SkeletonBlock className="-ml-1 h-4.5 w-4.5 rounded-[6px]" />
                <SkeletonBlock className="-ml-1 h-4.5 w-4.5 rounded-[6px]" />
              </div>
              <SkeletonBlock className="h-3.5 w-10" />
            </div>
            <SkeletonBlock className="h-7 w-28 shrink-0 rounded-[10px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultFeedCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#12161d] bg-[#05070b] shadow-[0_16px_36px_rgba(0,0,0,0.26)]">
      <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[21px] bg-[#05070b] ring-1 ring-white/[0.05]">
        <SkeletonBlock className="h-20 w-full rounded-none bg-white/[0.05]" />
        <div className="flex flex-1 flex-col px-4 pb-3.5 pt-2">
          <div className="flex items-start justify-between gap-3">
            <SkeletonBlock className="-mt-[1.5rem] h-[84px] w-[84px] shrink-0 rounded-full bg-white/[0.08]" />
            <div className="flex flex-col items-end gap-1 pt-1">
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-3 w-14" />
            </div>
          </div>
          <div className="mt-2 min-w-0">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-2 h-3 w-16" />
          </div>
          <div className="mt-2 min-w-0">
            <SkeletonBlock className="h-4 w-full max-w-[16rem]" />
            <SkeletonBlock className="mt-2 h-4 w-full max-w-[13rem]" />
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

function SidebarSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4 px-2 py-1">
      <div className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <SkeletonBlock className="h-3 w-18 rounded-full" />
          <SkeletonBlock className="h-3 w-10 rounded-full" />
        </div>
        <SkeletonBlock className="h-3 w-14 rounded-full" />
        <div className="flex flex-wrap gap-1.5">
          <SkeletonBlock className="h-6 w-18 rounded-[8px]" />
          <SkeletonBlock className="h-6 w-16 rounded-[8px]" />
        </div>
      </div>

      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item} className="space-y-2 border-t border-white/[0.03] pt-3 first:border-t-0 first:pt-0">
          <div className="flex items-center justify-between px-2.5">
            <SkeletonBlock className="h-3 w-14 rounded-full" />
            <SkeletonBlock className="h-3 w-3 rounded-full" />
          </div>
          <div className="space-y-1">
            <SkeletonBlock className="h-8 w-full rounded-[10px]" />
            <SkeletonBlock className="h-8 w-full rounded-[10px]" />
            <SkeletonBlock className="h-8 w-full rounded-[10px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DuosMobileFilterSkeleton() {
  return (
    <section className="space-y-2.5 px-5 py-1.5 sm:px-6 sm:py-2">
      <div className="flex items-center justify-between rounded-[12px] border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-7 w-7 rounded-[10px]" />
          <div className="space-y-1">
            <SkeletonBlock className="h-3.5 w-16" />
            <SkeletonBlock className="h-2.5 w-12 rounded-full" />
          </div>
        </div>
        <SkeletonBlock className="h-4 w-4 rounded-full" />
      </div>
      <SkeletonBlock className="h-3 w-20 rounded-full" />
    </section>
  );
}

function StacksMobileFilterSkeleton() {
  return (
    <section className="px-5 py-1.5 sm:px-6 sm:py-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <SkeletonBlock className="h-7.5 w-18 rounded-[10px]" />
          <SkeletonBlock className="h-7.5 w-20 rounded-[10px]" />
          <SkeletonBlock className="h-7.5 w-18 rounded-[10px]" />
          <SkeletonBlock className="h-7.5 w-19 rounded-[10px]" />
          <SkeletonBlock className="h-7.5 w-18 rounded-[10px]" />
          <SkeletonBlock className="h-7.5 w-18 rounded-[10px]" />
        </div>
        <SkeletonBlock className="h-3.5 w-28 rounded-full" />
      </div>
    </section>
  );
}

function getFeedSkeletonGridClassName(
  feedVariant: LFGFeedLoadingVariant,
  tone: LFGPageLoadingTone
) {
  if (feedVariant === "duos" || feedVariant === "stacks") {
    return tone === "duos"
      ? "grid gap-3.5 md:grid-cols-2"
      : "grid gap-3 md:grid-cols-2 lg:grid-cols-3";
  }

  return "grid gap-3 md:grid-cols-2 xl:grid-cols-4";
}

export function LFGPageLoading({
  breadcrumb = false,
  composerCta = false,
  composerOnly = false,
  feedLoading = "cards",
  feedVariant = "default",
  helperText,
  showDescription = true,
  tone = "default",
  title,
}: {
  breadcrumb?: boolean;
  composerCta?: boolean;
  composerOnly?: boolean;
  feedLoading?: "cards" | "none";
  feedVariant?: LFGFeedLoadingVariant;
  helperText?: string;
  showDescription?: boolean;
  tone?: LFGPageLoadingTone;
  title: string;
}) {
  const usesDuosTone = tone === "duos";
  const usesSharedLFGFeedLayout =
    !composerOnly && (feedVariant === "duos" || feedVariant === "stacks");
  const isDuosFeed = feedVariant === "duos";
  const isStacksFeed = feedVariant === "stacks";
  const centerClassName =
    usesSharedLFGFeedLayout && isDuosFeed ? "w-full max-w-[58rem]" : "w-full max-w-4xl";
  const sectionClassName = usesSharedLFGFeedLayout
    ? `flex min-h-0 w-full flex-1 min-w-0 flex-col ${
        isDuosFeed
          ? "lg:self-start"
          : "lg:self-start lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)]"
      }`
    : `${usesDuosTone ? "" : "rounded-[28px]"} flex min-h-0 w-full flex-1 min-w-0 flex-col`;
  const showsCreateCta = composerCta || usesSharedLFGFeedLayout;

  return (
    <AuthenticatedWorkspaceShell
      balanceDesktopCenter={!usesSharedLFGFeedLayout}
      centerClassName={centerClassName}
      maxWidthClassName={usesDuosTone ? "max-w-none" : "max-w-[96rem]"}
      rightRail={usesSharedLFGFeedLayout ? <SidebarSkeleton /> : undefined}
    >
      <section className={sectionClassName}>
        <div
          className={
            usesDuosTone
              ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] sm:shadow-none"
              : "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px]"
          }
        >
          <header
            className={`relative z-10 shrink-0 px-5 sm:px-6 ${
              composerOnly
                ? "py-3 sm:py-4"
                : usesDuosTone
                  ? usesSharedLFGFeedLayout
                    ? "border-b border-white/[0.04] py-2.5 sm:py-3"
                    : "py-3 sm:py-4"
                  : "py-5 sm:py-7"
            }`}
          >
            <div
              className={
                composerOnly
                  ? "space-y-3"
                  : usesDuosTone
                    ? usesSharedLFGFeedLayout
                      ? "space-y-2"
                      : "space-y-3"
                    : "space-y-5"
              }
            >
              {usesDuosTone && usesSharedLFGFeedLayout ? (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    {breadcrumb ? (
                      <SkeletonBlock className="h-3 w-24 rounded-full" />
                    ) : null}
                    <div className="space-y-1">
                      <h1 className="oc-profile-display text-[20px] font-bold tracking-[-0.03em] text-zinc-50 sm:text-[24px]">
                        {title}
                      </h1>
                      {showDescription ? (
                        <SkeletonBlock className="h-3.5 w-full max-w-xl" />
                      ) : null}
                      {helperText ? <SkeletonBlock className="h-3.5 w-full max-w-lg" /> : null}
                    </div>
                  </div>
                  <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
                    <SkeletonBlock className="h-8 w-full rounded-[10px] sm:w-[18rem]" />
                    {showsCreateCta ? (
                      <SkeletonBlock className="h-8 w-30 shrink-0 rounded-[10px]" />
                    ) : null}
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className={
                      usesDuosTone
                        ? "flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                        : "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
                    }
                  >
                    <div className={composerOnly ? "space-y-2" : "space-y-3"}>
                      {breadcrumb ? <SkeletonBlock className="h-3 w-24 rounded-full" /> : null}
                      <h1
                        className={
                          usesDuosTone
                            ? "oc-profile-display text-[20px] font-bold tracking-[-0.03em] text-zinc-50 sm:text-[24px]"
                            : `font-semibold tracking-[-0.075em] text-zinc-50 ${
                                composerOnly ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"
                              }`
                        }
                      >
                        {title}
                      </h1>
                    </div>
                    {showsCreateCta ? (
                      <SkeletonBlock className="h-9 w-32 shrink-0 rounded-[10px]" />
                    ) : null}
                  </div>
                  {showDescription ? (
                    <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
                  ) : null}
                  {helperText ? <SkeletonBlock className="mt-2 h-4 w-full max-w-lg" /> : null}
                </div>
              )}
            </div>
          </header>

          {composerOnly ? null : (
            <div
              className={
                usesDuosTone
                  ? "flex min-h-0 flex-1 flex-col border-t border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.014)_0%,rgba(255,255,255,0.006)_100%)] sm:border-t sm:border-white/[0.03] sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)]"
                  : "flex min-h-0 flex-1 flex-col"
              }
            >
              {usesSharedLFGFeedLayout ? (
                <div className="lg:hidden">
                  {isDuosFeed ? <DuosMobileFilterSkeleton /> : <StacksMobileFilterSkeleton />}
                </div>
              ) : null}

              <section className="flex-1 px-5 pb-6 pt-2 sm:px-6 sm:pb-7 sm:pt-2.5">
                {feedLoading === "cards" ? (
                  <div className={getFeedSkeletonGridClassName(feedVariant, tone)}>
                    {[0, 1, 2, 3].map((item) => (
                      <div key={item}>
                        {isStacksFeed ? (
                          <StacksFeedCardSkeleton />
                        ) : isDuosFeed ? (
                          <DuosFeedCardSkeleton />
                        ) : (
                          <DefaultFeedCardSkeleton />
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            </div>
          )}
        </div>
      </section>
    </AuthenticatedWorkspaceShell>
  );
}
