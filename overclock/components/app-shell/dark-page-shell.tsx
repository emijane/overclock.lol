import type { ReactNode } from "react";

import { PageContainer } from "@/components/app-shell/page-container";

type DarkPageShellProps = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  maxWidthClassName?: string;
  variant?: "default" | "matches";
};

const DEFAULT_MAIN_CLASS_NAME =
  "relative flex-1 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03),transparent_18%),#09090b] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8";

const MATCHES_MAIN_CLASS_NAME =
  "relative flex-1 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.045),transparent_24%),radial-gradient(circle_at_22%_0%,rgba(120,140,180,0.06),transparent_26%),radial-gradient(circle_at_80%_8%,rgba(255,255,255,0.03),transparent_20%),linear-gradient(180deg,#0b0b0d_0%,#09090b_44%,#070709_100%)] px-4 py-6 text-zinc-100 sm:px-6 sm:py-8";

const DEFAULT_OVERLAY_CLASS_NAMES = [
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-68 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]",
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.68)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-64 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]",
] as const;

const MATCHES_OVERLAY_CLASS_NAMES = [
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.42)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-18 [mask-image:radial-gradient(circle_at_34%_12%,black_0,black_12%,transparent_28%)]",
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(224,242,254,0.36)_0.6px,transparent_0.95px)] bg-[length:11px_11px] opacity-14 [mask-image:radial-gradient(circle_at_72%_62%,black_0,black_10%,transparent_24%)]",
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.03),transparent_30%)]",
  "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_46%,rgba(0,0,0,0.18)_78%,rgba(0,0,0,0.34)_100%)]",
] as const;

export function DarkPageShell({
  children,
  className = "",
  containerClassName,
  maxWidthClassName,
  variant = "default",
}: DarkPageShellProps) {
  const resolvedMainClassName = [
    variant === "matches" ? MATCHES_MAIN_CLASS_NAME : DEFAULT_MAIN_CLASS_NAME,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const overlayClassNames =
    variant === "matches" ? MATCHES_OVERLAY_CLASS_NAMES : DEFAULT_OVERLAY_CLASS_NAMES;
  const shouldWrapInPageContainer = Boolean(containerClassName || maxWidthClassName);

  return (
    <main className={resolvedMainClassName}>
      {overlayClassNames.map((overlayClassName) => (
        <div key={overlayClassName} aria-hidden="true" className={overlayClassName} />
      ))}
      {shouldWrapInPageContainer ? (
        <PageContainer
          className={["relative z-10", containerClassName].filter(Boolean).join(" ")}
          maxWidthClassName={maxWidthClassName}
        >
          {children}
        </PageContainer>
      ) : (
        <div className="relative z-10">{children}</div>
      )}
    </main>
  );
}
