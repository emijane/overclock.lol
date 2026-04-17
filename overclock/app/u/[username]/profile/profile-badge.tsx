import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
import type { ReactNode } from "react";

type ProfileBadgeProps = {
  children: ReactNode;
  className?: string;
  iconClassName?: string;
  Icon?: IconType | LucideIcon;
  tone?: "cover" | "default";
};

export function ProfileBadge({
  children,
  className = "",
  iconClassName = "",
  Icon,
  tone = "default",
}: ProfileBadgeProps) {
  const palette =
    tone === "cover"
      ? "border-white/10 bg-zinc-950/70 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
      : "border-white/10 bg-white/[0.045] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.16)]";

  return (
    <span
      className={`inline-flex h-8 items-center gap-2 rounded-full border px-3.5 text-[12px] font-semibold tracking-[-0.01em] backdrop-blur-md transition-colors ${palette} ${className}`}
    >
      {Icon ? <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} /> : null}
      {children}
    </span>
  );
}
