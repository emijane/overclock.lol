import { AccountWorkspaceShell } from "@/components/app-shell/account-workspace-shell";
import { DarkPageShell } from "@/components/app-shell/dark-page-shell";
import { PageContainer } from "@/components/app-shell/page-container";

export function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />;
}

function AccountPagePanel({
  children,
  title,
  action,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <>
      <div className="flex shrink-0 items-center justify-between px-5 py-3 sm:px-6">
        <h1 className="oc-profile-display text-[18px] font-bold tracking-[-0.03em] text-zinc-50">
          {title}
        </h1>
        {action}
      </div>
      <div className="border-t border-white/[0.05]" />
      {children}
    </>
  );
}

function WrappedAccountPageFrame(props: {
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <AccountWorkspaceShell>
      <AccountPagePanel {...props} />
    </AccountWorkspaceShell>
  );
}

export function AccountSettingsLoadingShell() {
  return (
    <AccountPagePanel title="Account">
      <div className="divide-y divide-white/[0.05]">
        <section className="px-5 py-4 sm:px-6">
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
              <SkeletonBlock className="h-24 w-24 rounded-full" />
              <div className="grid gap-3">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-12 w-full rounded-[16px]" />
                <SkeletonBlock className="h-12 w-full rounded-[16px]" />
              </div>
            </div>
            <SkeletonBlock className="h-24 w-full rounded-[18px]" />
            <div className="grid gap-3 md:grid-cols-2">
              <SkeletonBlock className="h-12 w-full rounded-[16px]" />
              <SkeletonBlock className="h-12 w-full rounded-[16px]" />
            </div>
            <div className="flex justify-end">
              <SkeletonBlock className="h-10 w-28 rounded-[10px]" />
            </div>
          </div>
        </section>
        <section className="px-5 py-4 sm:px-6">
          <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-2 h-3.5 w-full max-w-md" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <SkeletonBlock className="h-8 w-24 rounded-[10px]" />
              <SkeletonBlock className="h-8 w-14 rounded-[10px]" />
            </div>
          </div>
        </section>
        <section className="px-5 py-4 sm:px-6">
          <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-2 h-3.5 w-full max-w-sm" />
            <div className="mt-4 grid gap-2">
              <SkeletonBlock className="h-10 w-full rounded-[12px]" />
              <SkeletonBlock className="h-10 w-full rounded-[12px]" />
            </div>
          </div>
        </section>
      </div>
    </AccountPagePanel>
  );
}

export function AccountPostsLoadingShell() {
  return (
    <AccountPagePanel
      title="My posts"
      action={<SkeletonBlock className="h-7 w-24 rounded-[10px]" />}
    >
      <div className="px-5 py-4 sm:px-6">
        <div className="grid gap-1.5">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <SkeletonBlock className="h-4 w-full max-w-sm" />
                  <SkeletonBlock className="mt-2 h-3.5 w-32" />
                  <SkeletonBlock className="mt-3 h-3.5 w-full max-w-lg" />
                </div>
                <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <SkeletonBlock className="h-8 w-20 rounded-[10px]" />
          <SkeletonBlock className="h-3.5 w-16" />
          <SkeletonBlock className="h-8 w-20 rounded-[10px]" />
        </div>
      </div>
    </AccountPagePanel>
  );
}

export function AccountCompetitiveLoadingShell() {
  return (
    <AccountPagePanel
      title="Competitive"
      action={<SkeletonBlock className="h-7 w-24 rounded-[10px]" />}
    >
      <section className="px-5 py-4 sm:px-6 sm:py-4.5">
        <div className="grid items-stretch gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="mt-2 h-3.5 w-24" />
              <div className="mt-4 grid gap-2">
                <SkeletonBlock className="h-10 w-full rounded-[12px]" />
                <SkeletonBlock className="h-10 w-full rounded-[12px]" />
                <div className="flex flex-wrap gap-2">
                  <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                  <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                  <SkeletonBlock className="h-8 w-8 rounded-[10px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/[0.05] px-5 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3.5 w-28 rounded-full" />
        </div>

        <div className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
            <SkeletonBlock className="h-9 w-full rounded-[10px]" />
            <SkeletonBlock className="h-9 w-full rounded-[10px]" />
          </div>

          <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-3.5 w-full max-w-md" />
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <SkeletonBlock className="h-12 w-full rounded-[12px]" />
              <SkeletonBlock className="h-12 w-full rounded-[12px]" />
              <SkeletonBlock className="h-12 w-full rounded-[12px]" />
            </div>
          </div>
        </div>
      </section>
    </AccountPagePanel>
  );
}

export function AccountConnectionsLoadingShell() {
  return (
    <WrappedAccountPageFrame title="Connections" action={null}>
      <div className="px-5 py-4 sm:px-6">
        <section className="overflow-hidden rounded-[14px] border border-white/[0.06] bg-white/[0.02]">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
            <div className="space-y-1">
              <SkeletonBlock className="h-3 w-16 rounded-full" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <SkeletonBlock className="h-7 w-18 rounded-[10px]" />
              <SkeletonBlock className="h-7 w-18 rounded-[10px]" />
            </div>
          </div>
          <div className="grid gap-0">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className={`${item < 2 ? "border-b border-white/[0.06]" : ""} px-4 py-3.5 sm:px-5`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <SkeletonBlock className="h-10 w-10 rounded-full" />
                    <div className="min-w-0">
                      <SkeletonBlock className="h-4 w-28" />
                      <SkeletonBlock className="mt-2 h-3 w-20" />
                    </div>
                  </div>
                  <SkeletonBlock className="h-8 w-20 rounded-[10px]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WrappedAccountPageFrame>
  );
}

export function MatchesLoadingShell() {
  return (
    <DarkPageShell
      className="oc-atmosphere-bg py-6 sm:py-8"
      containerClassName="flex flex-col gap-2.5"
      maxWidthClassName="max-w-none"
      variant="matches"
    >
      <section className="mx-auto w-full max-w-[56rem] rounded-[16px] sm:max-w-[58rem]">
        <div className="overflow-hidden rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] sm:shadow-none">
          <header className="px-5 py-2.5 sm:px-6 sm:py-3.5">
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-18 rounded-full" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-6 w-32" />
                <SkeletonBlock className="h-3.5 w-full max-w-xl" />
              </div>
            </div>
          </header>
          <section className="grid gap-2 px-5 pb-5 pt-1.5 sm:px-6 sm:pb-6 sm:pt-2">
            <div className="overflow-hidden rounded-[12px] border border-white/[0.06] bg-white/[0.02]">
              <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
                <div className="space-y-1">
                  <SkeletonBlock className="h-3 w-16 rounded-full" />
                  <SkeletonBlock className="h-4 w-34" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SkeletonBlock className="h-9 w-20 rounded-[10px]" />
                  <SkeletonBlock className="h-9 w-22 rounded-[10px]" />
                </div>
              </div>
              <div className="grid gap-0">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className={`${item < 2 ? "border-b border-white/[0.06]" : ""} px-4 py-4 sm:px-5`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <SkeletonBlock className="h-10 w-10 rounded-full" />
                        <div className="min-w-0">
                          <SkeletonBlock className="h-4 w-28" />
                          <SkeletonBlock className="mt-2 h-3 w-24" />
                        </div>
                      </div>
                      <SkeletonBlock className="h-8 w-24 rounded-[10px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </DarkPageShell>
  );
}

export function LoginLoadingShell() {
  return (
    <DarkPageShell
      className="flex"
      containerClassName="flex flex-1 flex-col justify-center"
      maxWidthClassName="max-w-4xl"
    >
      <section className="relative mx-auto w-full max-w-[42rem] rounded-[28px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 inset-y-8 rounded-full bg-white/[0.05] blur-3xl"
        />
        <div className="overflow-hidden rounded-[28px]">
          <div className="relative z-10 grid gap-3">
            <div className="rounded-[28px] border border-white/[0.08] bg-black/20 p-6 sm:p-8">
              <SkeletonBlock className="h-3 w-24 rounded-full" />
              <SkeletonBlock className="mt-4 h-8 w-56" />
              <SkeletonBlock className="mt-3 h-4 w-full max-w-md" />
              <SkeletonBlock className="mt-2 h-4 w-full max-w-sm" />
              <SkeletonBlock className="mt-8 h-12 w-full rounded-[16px]" />
            </div>
          </div>
        </div>
      </section>
    </DarkPageShell>
  );
}

export function OnboardingLoadingShell() {
  return (
    <main className="flex-1 bg-slate-950 px-6 py-12 text-slate-100">
      <PageContainer className="flex min-h-[calc(100vh-6rem)] items-center">
        <section className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <SkeletonBlock className="h-3 w-24 rounded-full bg-slate-700/60" />
          <SkeletonBlock className="mt-4 h-8 w-64 bg-slate-700/60" />
          <SkeletonBlock className="mt-4 h-4 w-full max-w-lg bg-slate-700/60" />
          <SkeletonBlock className="mt-2 h-4 w-full max-w-md bg-slate-700/60" />
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <SkeletonBlock className="h-3 w-28 rounded-full bg-slate-700/60" />
            <div className="mt-4 flex items-center gap-4">
              <SkeletonBlock className="h-16 w-16 rounded-full bg-slate-700/60" />
              <div className="min-w-0">
                <SkeletonBlock className="h-5 w-40 bg-slate-700/60" />
                <SkeletonBlock className="mt-2 h-4 w-28 bg-slate-700/60" />
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            <div>
              <SkeletonBlock className="h-6 w-44 bg-slate-700/60" />
              <SkeletonBlock className="mt-3 h-4 w-full max-w-md bg-slate-700/60" />
            </div>
            <div className="grid gap-2">
              <SkeletonBlock className="h-4 w-20 bg-slate-700/60" />
              <SkeletonBlock className="h-12 w-full rounded-2xl bg-slate-700/60" />
            </div>
            <div className="grid gap-2">
              <SkeletonBlock className="h-4 w-24 bg-slate-700/60" />
              <SkeletonBlock className="h-12 w-full rounded-2xl bg-slate-700/60" />
            </div>
            <SkeletonBlock className="h-12 w-32 rounded-[10px] bg-slate-700/60" />
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

export function SearchUsersLoadingShell() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <SkeletonBlock className="h-11 w-full rounded-[10px]" />
      <div className="mt-6">
        <SkeletonBlock className="mb-3 h-3 w-20 rounded-full" />
        <div className="oc-surface-panel rounded-[22px]">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className={`${item < 3 ? "border-b border-white/6" : ""} flex items-center gap-3 px-4 py-3`}
            >
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="mt-2 h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
