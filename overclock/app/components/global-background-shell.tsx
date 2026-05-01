import type { ReactNode } from "react";

type GlobalBackgroundShellProps = {
    children: ReactNode;
};

export function GlobalBackgroundShell({
    children,
}: GlobalBackgroundShellProps) {
    return (
        <div className="relative min-h-full flex-1 overflow-hidden bg-[#010103]">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.34)_0.45px,transparent_0.7px)] bg-[length:11px_11px] [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]" />
            </div>
            <div className="relative z-10 flex min-h-full flex-1 flex-col">
                {children}
            </div>
        </div>
    );
}
