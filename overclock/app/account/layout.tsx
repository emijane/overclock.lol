import type { ReactNode } from "react";

import { PageContainer } from "@/components/app-shell/page-container";

import { AccountSettingsNavigation } from "./components/account-settings-navigation";

export default function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="oc-atmosphere-bg relative flex min-h-0 flex-1 flex-col px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <PageContainer maxWidthClassName="max-w-[96rem]">
        <section className="flex items-stretch gap-4 xl:gap-5">
          <aside className="hidden w-56 shrink-0 self-start lg:block">
            <AccountSettingsNavigation />
          </aside>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] sm:shadow-none">
            <div className="border-b border-white/[0.05] px-3 py-3 lg:hidden">
              <AccountSettingsNavigation mobile />
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4">
              {children}
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
