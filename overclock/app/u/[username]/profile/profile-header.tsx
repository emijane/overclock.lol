import Image from "next/image";
import { Clock3Icon, Globe2Icon } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { FaComputerMouse } from "react-icons/fa6";
import { IoGameController } from "react-icons/io5";
import { SiBattledotnet } from "react-icons/si";

type ProfileHeaderProps = {
  avatarUrl: string | null;
  bio: string | null;
  currentRank: string | null;
  currentRankIconSrc: string | null;
  currentRankPill: string;
  displayName: string;
  discordUsername: string | null;
  battleNet: string | null;
  platform: string | null;
  region: string | null;
  timezone: string | null;
  username: string;
};

const rolePillTemplate = ["Tank", "DPS", "Support"] as const;

export function ProfileHeader({
  avatarUrl,
  bio,
  currentRank,
  currentRankIconSrc,
  currentRankPill,
  displayName,
  discordUsername,
  battleNet,
  platform,
  region,
  timezone,
  username,
}: ProfileHeaderProps) {
  const PlatformIcon = platform === "PC" ? FaComputerMouse : IoGameController;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#d7dee8] bg-[#ffffff]">
      <div className="pb-6">
        <div className="flex h-28 items-start justify-end gap-2 bg-[#f6ead7] px-5 py-4">
          {region ? (
            <span className="inline-flex h-8 items-center gap-2 rounded-full border border-[#e8dcc8] bg-[#fff7eb] px-3 text-[13px] font-semibold leading-none text-[#111827]">
              <Globe2Icon className="h-4 w-4 shrink-0 text-[#00aef0]" />
              {region}
            </span>
          ) : null}
          {timezone ? (
            <span className="inline-flex h-8 items-center gap-2 rounded-full border border-[#e8dcc8] bg-[#fff7eb] px-3 text-[13px] font-semibold leading-none text-[#111827]">
              <Clock3Icon className="h-4 w-4 shrink-0 text-[#f99e1a]" />
              {timezone}
            </span>
          ) : null}
        </div>

        <div className="-mt-10 px-5">
          <div className="w-fit">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                className="h-24 w-24 rounded-full border-4 border-[#ffffff] bg-[#fde2b2] object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#ffffff] bg-[#fde2b2] text-3xl font-semibold text-[#111827]">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 px-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold leading-6 tracking-tight text-[#111827]">
              {displayName}
            </h1>
            {currentRankIconSrc && currentRank ? (
              <Image
                src={currentRankIconSrc}
                alt={`${currentRank} rank icon`}
                width={44}
                height={44}
                className="h-6 w-6 object-contain"
              />
            ) : null}
          </div>
          <p className="mt-1 text-[15px] leading-5 text-[#4b5563]">@{username}</p>
          <p className="max-w-2xl text-[15px] leading-6 text-black/80">
            {bio || "This player has not added a bio yet."}
          </p>

          <div className="mt-3 flex flex-col gap-2 text-[15px] leading-5 text-[#111827]">
            {discordUsername ? (
              <div className="flex items-center gap-2">
                <FaDiscord className="h-4 w-4 shrink-0 text-[#5865F2]" />
                <span>@{discordUsername}</span>
              </div>
            ) : null}
            {battleNet ? (
              <div className="flex items-center gap-2">
                <SiBattledotnet className="h-4 w-4 shrink-0 text-[#00aef0]" />
                <span>{battleNet}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 px-5">
          <span className="inline-flex h-8 items-center gap-2 rounded-full border border-[#d7dee8] bg-[#f7f9fc] px-3 text-[13px] font-semibold leading-none text-[#111827]">
            {currentRankIconSrc && currentRank ? (
              <Image
                src={currentRankIconSrc}
                alt={`${currentRank} rank icon`}
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 object-contain"
              />
            ) : null}
            {currentRankPill}
          </span>
          {platform ? (
            <span className="inline-flex h-8 items-center gap-2 rounded-full border border-[#d7dee8] bg-[#f7f9fc] px-3 text-[13px] font-semibold leading-none text-[#111827]">
              <PlatformIcon className="h-4 w-4" />
              {platform}
            </span>
          ) : null}
          {rolePillTemplate.map((role) => (
            <span
              key={role}
              className="inline-flex h-8 items-center rounded-full border border-[#d7dee8] bg-[#f7f9fc] px-3 text-[13px] font-semibold leading-none text-[#111827]"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
