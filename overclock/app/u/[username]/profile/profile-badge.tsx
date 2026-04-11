import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
import type { ReactNode } from "react";

type ProfileBadgeProps = {
  children: ReactNode;
  iconClassName?: string;
  Icon?: IconType | LucideIcon;
  tone?: "cover" | "default";
};

export function ProfileBadge({
  children,
  iconClassName = "",
  Icon,
  tone = "default",
}: ProfileBadgeProps) {
  const palette =
    tone === "cover"
      ? "border-zinc-700/80 bg-zinc-900/80 text-zinc-100 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]"
      : "border-zinc-800 bg-zinc-900/90 text-zinc-100 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]";

  return (
    <span
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium tracking-[-0.01em] backdrop-blur-sm ${palette}`}
    >
      {Icon ? <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} /> : null}
      {children}
    </span>
  );
}
