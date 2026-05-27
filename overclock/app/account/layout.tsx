import type { ReactNode } from "react";

import { AccountWorkspaceShell } from "@/components/app-shell/account-workspace-shell";

export default function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AccountWorkspaceShell>{children}</AccountWorkspaceShell>;
}
