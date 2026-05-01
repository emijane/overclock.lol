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
      ? "border-white/10 bg-white/[0.04] text-white/80"
      : "border-white/10 bg-white/5 text-zinc-100";

  return (
    <span
      className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium tracking-[-0.01em] backdrop-blur-md transition-all duration-200 ${palette} ${className}`}
    >
      {Icon ? <Icon className={`h-3.5 w-3.5 shrink-0 ${iconClassName}`} /> : null}
      {children}
    </span>
  );
}
