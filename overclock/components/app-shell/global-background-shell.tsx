import type { ReactNode } from "react";

type GlobalBackgroundShellProps = {
  children: ReactNode;
};

export function GlobalBackgroundShell({
  children,
}: GlobalBackgroundShellProps) {
  return (
    <div className="oc-atmosphere-bg relative flex-1 overflow-clip">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="oc-atmosphere-dots-primary absolute inset-0" />
        <div className="oc-atmosphere-dots-secondary absolute inset-0" />
        <div className="oc-atmosphere-spotlight absolute inset-0" />
        <div className="oc-atmosphere-vignette absolute inset-0" />
      </div>
      <div className="relative z-10 flex min-h-dvh flex-col">
        {children}
      </div>
    </div>
  );
}
