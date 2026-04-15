import {
  Clock3Icon,
  Gamepad2Icon,
  Globe2Icon,
  InfoIcon,
  type LucideIcon,
} from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { SiBattledotnet } from "react-icons/si";
import type { IconType } from "react-icons";

export type IntroItem = {
  label: string;
  value: string;
};

export type IntroGroup = {
  heading: string;
  items: IntroItem[];
};

type IntroCardProps = {
  groups: IntroGroup[];
};

const introIconByLabel = {
  "Battle.net": { Icon: SiBattledotnet, className: "text-[#00aef0]" },
  Discord: { Icon: FaDiscord, className: "text-[#5865F2]" },
  Platform: { Icon: Gamepad2Icon, className: "text-[#f99e1a]" },
  Region: { Icon: Globe2Icon, className: "text-[#00aef0]" },
  Server: { Icon: Clock3Icon, className: "text-[#f99e1a]" },
} as const satisfies Record<
  string,
  { Icon: IconType | LucideIcon; className: string }
>;

export function IntroCard({ groups }: IntroCardProps) {
  return (
    <div className="rounded-2xl border border-[#d7dee8] bg-[#ffffff] p-4">
      <div className="grid gap-4">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.heading}>
              <div className="grid gap-3">
                {group.items.map((item) => {
                  const iconConfig = introIconByLabel[item.label as keyof typeof introIconByLabel] ?? {
                    Icon: InfoIcon,
                    className: "text-[#6b7280]",
                  };
                  const { Icon } = iconConfig;

                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 text-[15px] leading-5"
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${iconConfig.className}`}
                      />
                      <span className="min-w-0 truncate font-medium text-[#111827]">
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-[15px] leading-5 text-[#6b7280]">
            No profile details added yet.
          </p>
        )}
      </div>
    </div>
  );
}
