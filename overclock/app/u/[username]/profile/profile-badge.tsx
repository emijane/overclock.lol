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
      ? "border-white/[0.08] bg-[#090909]/88 text-zinc-200"
      : "border-white/[0.06] bg-white/[0.03] text-zinc-100";

  return (
    <span
      className={`oc-profile-meta inline-flex h-6 items-center gap-1 rounded-[10px] border px-2 py-0.5 text-[11px] font-medium transition-all duration-150 ${tone === "cover" ? "" : "backdrop-blur-md"} ${palette} ${className}`}
    >
      {Icon ? <Icon className={`h-3 w-3 shrink-0 ${iconClassName}`} /> : null}
      {children}
    </span>
  );
}
