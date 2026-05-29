import { AuthenticatedWorkspaceShell } from "@/components/app-shell/authenticated-workspace-shell";
import { SkeletonBlock } from "@/components/app-shell/page-loading-shells";

export default function Loading() {
  return (
    <AuthenticatedWorkspaceShell balanceDesktopCenter={false} centerClassName="w-full max-w-5xl">
      <div className="flex max-h-[calc(100vh-4rem)] min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] sm:shadow-none">
        <div className="flex shrink-0 items-center justify-between px-5 py-3 sm:px-6">
          <SkeletonBlock className="h-5 w-24 rounded-[10px]" />
        </div>
        <div className="border-t border-white/[0.05]" />
        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="hidden min-h-0 overflow-hidden border-r border-white/[0.06] lg:block">
            <div className="border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
              <SkeletonBlock className="h-3 w-12 rounded-full" />
              <SkeletonBlock className="mt-2 h-4 w-28 rounded-[10px]" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto space-y-0">
              {[0, 1, 2].map((item) => (
                <div key={item} className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
                  <SkeletonBlock className="h-4 w-24 rounded-[10px]" />
                  <SkeletonBlock className="mt-2 h-3 w-full rounded-[10px]" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
              <SkeletonBlock className="h-5 w-36 rounded-[10px]" />
              <SkeletonBlock className="mt-2 h-3 w-40 rounded-[10px]" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto space-y-3 px-4 py-4 sm:px-5">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`flex ${item % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                  <SkeletonBlock className="h-16 w-56 rounded-[14px]" />
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.06] px-4 py-3.5 sm:px-5">
              <SkeletonBlock className="h-28 w-full rounded-[14px]" />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedWorkspaceShell>
  );
}
