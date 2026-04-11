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
      ? "border-[#eadbc4] bg-[#fff9f1] text-[#2f2a24] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]"
      : "border-[#d9e1ec] bg-[#f8fafc]/90 text-[#1f2937] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]";

  return (
    <span
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium tracking-[-0.01em] backdrop-blur-sm ${palette}`}
    >
      {Icon ? <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} /> : null}
      {children}
    </span>
  );
}
