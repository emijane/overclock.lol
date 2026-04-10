import {
  Clock3Icon,
  Gamepad2Icon,
  Globe2Icon,
  InfoIcon,
  type LucideIcon,
} from "lucide-react";
import { FaDiscord, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
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
  "Battle.net": { Icon: SiBattledotnet, className: "text-sky-400" },
  Discord: { Icon: FaDiscord, className: "text-[#5865F2]" },
  Platform: { Icon: Gamepad2Icon, className: "text-zinc-500" },
  Region: { Icon: Globe2Icon, className: "text-zinc-500" },
  Timezone: { Icon: Clock3Icon, className: "text-zinc-500" },
  Twitter: { Icon: FaXTwitter, className: "text-white" },
  YouTube: { Icon: FaYoutube, className: "text-[#FF0000]" },
} as const satisfies Record<
  string,
  { Icon: IconType | LucideIcon; className: string }
>;

export function IntroCard({ groups }: IntroCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
      <div className="grid gap-5">
        {groups.length > 0 ? (
          groups.map((group) => (
            <div key={group.heading}>
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-zinc-500">
                {group.heading}
              </h2>
              <div className="mt-3 grid gap-3">
                {group.items.map((item) => {
                  const iconConfig = introIconByLabel[item.label] ?? {
                    Icon: InfoIcon,
                    className: "text-zinc-500",
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
                      <span className="min-w-0 truncate font-medium text-zinc-100">
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-[15px] leading-5 text-zinc-500">
            No profile details added yet.
          </p>
        )}
      </div>
    </div>
  );
}
