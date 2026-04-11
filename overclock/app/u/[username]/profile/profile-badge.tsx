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
      ? "border-[#e8dcc8] bg-[#fff7eb]"
      : "border-[#d7dee8] bg-[#f7f9fc]";

  return (
    <span
      className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold leading-none text-[#111827] ${palette}`}
    >
      {Icon ? <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} /> : null}
      {children}
    </span>
  );
}
