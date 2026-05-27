import type { ReactNode } from "react";

import { AuthenticatedWorkspaceShell } from "@/components/app-shell/authenticated-workspace-shell";

type AccountWorkspaceShellProps = {
  children: ReactNode;
};

export function AccountWorkspaceShell({
  children,
}: AccountWorkspaceShellProps) {
  return (
    <AuthenticatedWorkspaceShell centerClassName="w-full max-w-4xl">
      <div className="flex flex-1 flex-col overflow-clip rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_28%,rgba(7,7,9,0.96)_100%)] shadow-[0_16px_36px_rgba(0,0,0,0.22)] sm:rounded-[10px] sm:border-0 sm:bg-[linear-gradient(180deg,rgba(255,255,255,0.012)_0%,rgba(255,255,255,0.006)_100%)] sm:shadow-none">
        <div className="flex w-full min-w-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </AuthenticatedWorkspaceShell>
  );
}
