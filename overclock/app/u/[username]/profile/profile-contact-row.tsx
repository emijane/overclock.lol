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
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${iconClassName}`} />
      <span>{value}</span>
    </div>
  );
}
