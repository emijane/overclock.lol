import Image from "next/image";
import { Clock3Icon, Globe2Icon } from "lucide-react";
import { FaComputerMouse } from "react-icons/fa6";
import { IoGameController } from "react-icons/io5";

import { ProfileAvatar } from "./profile-avatar";
import { ProfileBadge } from "./profile-badge";
import { ProfileSocialLinks } from "./profile-social-links";

type ProfileHeaderProps = {
  avatarUrl: string | null;
  bio: string | null;
  currentRank: string | null;
  currentRankIconSrc: string | null;
  currentRankPill: string;
  displayName: string;
  platform: string | null;
  region: string | null;
  roleLabels: string[];
  socialLinks: Array<{
    label: string;
    platform: "discord" | "battlenet" | "twitch" | "x" | "youtube";
    value: string;
  }>;
  timezone: string | null;
  username: string;
};

export function ProfileHeader({
  avatarUrl,
  bio,
  currentRank,
  currentRankIconSrc,
  currentRankPill,
  displayName,
  platform,
  region,
  roleLabels,
  socialLinks,
  timezone,
  username,
}: ProfileHeaderProps) {
  const PlatformIcon = platform === "PC" ? FaComputerMouse : IoGameController;

  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900">
      <div className="pb-6 sm:pb-7">
        <div className="flex min-h-36 items-start justify-end gap-2 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 px-4 py-4 sm:h-40 sm:px-6">
          {region ? (
            <ProfileBadge
              Icon={Globe2Icon}
              iconClassName="text-sky-400"
              tone="cover"
            >
              {region}
            </ProfileBadge>
          ) : null}
          {timezone ? (
            <ProfileBadge
              Icon={Clock3Icon}
              iconClassName="text-amber-400"
              tone="cover"
            >
              {timezone}
            </ProfileBadge>
          ) : null}
        </div>

        <div className="-mt-14 px-4 sm:-mt-16 sm:px-6">
          <div className="w-fit">
            <ProfileAvatar avatarUrl={avatarUrl} displayName={displayName} />
          </div>
        </div>

        <div className="mt-6 px-4 sm:-mt-10 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <div className="sm:h-12" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[32px] font-semibold leading-[1.05] tracking-[-0.04em] text-zinc-50">
                  {displayName}
                </h1>
                {currentRankIconSrc && currentRank ? (
                  <Image
                    src={currentRankIconSrc}
                    alt={`${currentRank} rank icon`}
                    width={44}
                    height={44}
                    className="h-7 w-7 object-contain"
                  />
                ) : null}
              </div>
              <p className="mt-1.5 text-[15px] font-medium tracking-[-0.01em] text-zinc-500">
                @{username}
              </p>
              <p className="mt-3 max-w-2xl text-[17px] leading-7 tracking-[-0.015em] text-zinc-300">
                {bio || "This player has not added a bio yet."}
              </p>
            </div>

            <div className="sm:min-w-[220px]">
              <ProfileSocialLinks links={socialLinks} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2.5 px-4 sm:px-6">
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
          {roleLabels.map((role) => (
            <ProfileBadge key={role}>
              {role}
            </ProfileBadge>
          ))}
        </div>
      </div>
    </section>
  );
}
