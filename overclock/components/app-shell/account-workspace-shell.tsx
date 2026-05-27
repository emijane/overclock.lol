import type { ReactNode } from "react";

import { PageContainer } from "@/components/app-shell/page-container";
import { AccountSettingsNavigation } from "@/components/navigation/account-settings-navigation";

type AccountWorkspaceShellProps = {
  children: ReactNode;
};

export function AccountWorkspaceShell({
  children,
}: AccountWorkspaceShellProps) {
  return (
    <main className="oc-atmosphere-bg relative flex min-h-0 flex-1 flex-col px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div
        aria-hidden="true"
        className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="oc-atmosphere-spotlight pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="oc-atmosphere-vignette pointer-events-none absolute inset-0"
      />
      <PageContainer
        className="relative z-10 flex flex-1 items-stretch"
        maxWidthClassName="max-w-4xl"
      >
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col overflow-clip rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] sm:shadow-none">
            <div className="border-b border-white/[0.05] px-4 py-2.5 sm:px-5 lg:hidden">
              <AccountSettingsNavigation mobile />
            </div>
            <div className="flex flex-1">
              <aside className="hidden w-44 shrink-0 border-r border-white/[0.05] lg:block">
                <AccountSettingsNavigation />
              </aside>
              <div className="flex w-full min-w-0 flex-1 flex-col">
                {children}
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
