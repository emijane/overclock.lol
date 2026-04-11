import Image from "next/image";
import { Clock3Icon, Globe2Icon } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { FaComputerMouse } from "react-icons/fa6";
import { IoGameController } from "react-icons/io5";
import { SiBattledotnet } from "react-icons/si";

import { ProfileAvatar } from "./profile-avatar";
import { ProfileBadge } from "./profile-badge";
import { ProfileContactRow } from "./profile-contact-row";

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
      <div className="pb-5 sm:pb-6">
        <div className="flex min-h-24 items-start justify-end gap-2 bg-[#f6ead7] px-4 py-4 sm:h-28 sm:px-5">
          {region ? (
            <ProfileBadge
              Icon={Globe2Icon}
              iconClassName="text-[#00aef0]"
              tone="cover"
            >
              {region}
            </ProfileBadge>
          ) : null}
          {timezone ? (
            <ProfileBadge
              Icon={Clock3Icon}
              iconClassName="text-[#f99e1a]"
              tone="cover"
            >
              {timezone}
            </ProfileBadge>
          ) : null}
        </div>

        <div className="-mt-10 px-4 sm:px-5">
          <div className="w-fit">
            <ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} />
          </div>
        </div>

        <div className="mt-4 px-4 sm:px-5">
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
              <ProfileContactRow
                Icon={FaDiscord}
                iconClassName="text-[#5865F2]"
                value={`@${discordUsername}`}
              />
            ) : null}
            {battleNet ? (
              <ProfileContactRow
                Icon={SiBattledotnet}
                iconClassName="text-[#00aef0]"
                value={battleNet}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 px-4 sm:px-5">
          <ProfileBadge>
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
          </ProfileBadge>
          {platform ? (
            <ProfileBadge Icon={PlatformIcon}>
              {platform}
            </ProfileBadge>
          ) : null}
          {rolePillTemplate.map((role) => (
            <ProfileBadge key={role}>
              {role}
            </ProfileBadge>
          ))}
        </div>
      </div>
    </section>
  );
}
