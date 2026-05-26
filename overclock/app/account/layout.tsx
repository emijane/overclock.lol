import type { ReactNode } from "react";

import { DarkPageShell } from "@/components/app-shell/dark-page-shell";

import { AccountSettingsNavigation } from "./components/account-settings-navigation";

export default function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DarkPageShell
      containerClassName="flex flex-col gap-3 lg:gap-4"
      maxWidthClassName="max-w-[88rem]"
    >
      <div className="lg:hidden">
        <AccountSettingsNavigation mobile />
      </div>

      <div className="grid gap-3 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-4">
        <aside className="hidden lg:block">
          <AccountSettingsNavigation />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </DarkPageShell>
  );
}
