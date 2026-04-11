import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";

type ProfileContactRowProps = {
  value: string;
  iconClassName: string;
  Icon: IconType | LucideIcon;
};

export function ProfileContactRow({
  value,
  iconClassName,
  Icon,
}: ProfileContactRowProps) {
  return (
    <div className="flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.01em] text-[#1f2937]">
      <Icon className={`h-[15px] w-[15px] shrink-0 ${iconClassName}`} />
      <span className="text-[#243041]">{value}</span>
    </div>
  );
}
