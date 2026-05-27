import type { ReactNode } from "react";

import { PageContainer } from "@/components/app-shell/page-container";
import { GlobalSidebarNavServer } from "@/components/navigation/global-sidebar-nav-server";

type AuthenticatedWorkspaceShellProps = {
  children: ReactNode;
  centerClassName?: string;
  mainClassName?: string;
  maxWidthClassName?: string;
  rightRail?: ReactNode;
  rightRailClassName?: string;
};

export async function AuthenticatedWorkspaceShell({
  children,
  centerClassName = "",
  mainClassName = "",
  maxWidthClassName = "max-w-none",
  rightRail,
  rightRailClassName = "",
}: AuthenticatedWorkspaceShellProps) {
  return (
    <main
      className={`oc-atmosphere-bg relative flex min-h-0 flex-1 flex-col px-4 py-6 text-zinc-100 sm:px-6 sm:py-8 ${mainClassName}`.trim()}
    >
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
        className="relative z-10 flex flex-1 items-stretch gap-4 xl:gap-5"
        maxWidthClassName={maxWidthClassName}
      >
        <aside className="hidden w-56 shrink-0 self-start lg:block">
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto oc-sidebar-scroll">
            <GlobalSidebarNavServer />
          </div>
        </aside>
        <section
          className={`flex min-w-0 flex-1 flex-col ${centerClassName}`.trim()}
        >
          {children}
        </section>
        {rightRail ? (
          <aside
            className={`hidden w-56 shrink-0 self-start lg:block ${rightRailClassName}`.trim()}
          >
            <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto oc-sidebar-scroll">
              {rightRail}
            </div>
          </aside>
        ) : null}
      </PageContainer>
    </main>
  );
}
