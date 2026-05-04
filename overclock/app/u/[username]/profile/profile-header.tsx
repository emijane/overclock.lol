import Image from "next/image";
import { Clock3Icon, Globe2Icon } from "lucide-react";

import { ProfileAvatar } from "./profile-avatar";
import { ProfileBadge } from "./profile-badge";
import { ProfileCoverUploadButton } from "./profile-cover-upload-button";
import { ProfilePresenceBadges } from "./profile-presence-badges";
import { ProfileSocialLinks } from "./profile-social-links";
import { LookingToPlayBadge } from "@/app/components/looking-to-play-badge";
import { PROFILE_COVER_ASPECT_RATIO } from "@/lib/profiles/profile-media";

type ProfileHeaderProps = {
  avatarUrl: string | null;
  bio: string | null;
  coverImageUrl: string | null;
  currentRank: string | null;
  currentRankTier?: string | null;
  currentRankIconSrc: string | null;
  currentRankPill: string;
  displayName: string;
  id: string;
  isOwner: boolean;
  isLookingToPlay?: boolean | null;
  lastSeenAt?: Date | string | null;
  lookingFor?: string[] | null;
  platform: string | null;
  region: string | null;
  socialLinks: Array<{
    label: string;
    platform: "discord" | "battlenet" | "twitch" | "x" | "youtube";
    value: string;
  }>;
  timezone: string | null;
  username: string;
  onEditProfile?: () => void;
};

const rankBadgeClassNameByTier: Record<string, string> = {
  Bronze: "border-[#D08050]/30 bg-[#A05030]/15",
  Silver: "border-[#D0E0E8]/25 bg-[#A0B0C0]/12",
  Gold: "border-[#F0E080]/30 bg-[#D0A030]/15",
  Platinum: "border-[#D0FFFF]/30 bg-[#A0C0D0]/14",
  Diamond: "border-[#80B0F0]/30 bg-[#4060A0]/18",
  Master: "border-[#C0E0D0]/30 bg-[#306040]/18",
  Grandmaster: "border-[#F0E0FF]/30 bg-[#403070]/20",
  Champion: "border-[#F0ABFC]/35 bg-[#A855F7]/18",
  "Top 500": "border-[#F0E090]/35 bg-[#E0B040]/16",
};

export function ProfileHeader({
  avatarUrl,
  bio,
  coverImageUrl,
  currentRank,
  currentRankIconSrc,
  currentRankPill,
  currentRankTier,
  displayName,
  id,
  isOwner,
  isLookingToPlay,
  lastSeenAt,
  platform,
  region,
  socialLinks,
  timezone,
  username,
  onEditProfile,
}: ProfileHeaderProps) {
  const rankBadgeClassName =
    rankBadgeClassNameByTier[currentRankTier ?? ""] ??
    "border-white/10 bg-white/[0.02]";

  return (
    <section className="bg-[#05070b]">
      <div className="pb-6 sm:pb-7">
        <div
          className="relative overflow-hidden px-4 py-4 sm:px-6"
          style={{ aspectRatio: PROFILE_COVER_ASPECT_RATIO }}
        >
          {coverImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </>
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#0a0b10] via-[#07080d] to-[#05070b]"
              aria-hidden="true"
            />
          )}
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              {isOwner ? <ProfileCoverUploadButton /> : null}
            </div>

            <div className="flex items-start gap-1.5">
              {region ? (
                <ProfileBadge
                  Icon={Globe2Icon}
                  iconClassName="text-sky-400/80"
                  tone="cover"
                >
                  {region}
                </ProfileBadge>
              ) : null}
              {timezone ? (
                <ProfileBadge
                  Icon={Clock3Icon}
                  iconClassName="text-amber-400/80"
                  tone="cover"
                >
                  {timezone}
                </ProfileBadge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative z-20 -mt-14 px-4 sm:-mt-16 sm:px-6">
          <div className="pointer-events-auto w-fit">
            <ProfileAvatar
              avatarUrl={avatarUrl}
              currentRankTier={currentRankTier}
              displayName={displayName}
              isLookingToPlay={isLookingToPlay}
              lastSeenAt={lastSeenAt}
              userId={id}
            />
          </div>
        </div>

        <div className="mt-7 px-4 sm:-mt-10 sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <div className="sm:h-14" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[25px] font-semibold leading-[1.05] tracking-[-0.04em] text-zinc-50">
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
              <p className="text-[15px] font-medium tracking-[-0.01em] text-zinc-500">
                @{username}
              </p>
              {platform || isLookingToPlay ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {platform ? (
                    <LookingToPlayBadge className={rankBadgeClassName}>
                      {platform}
                    </LookingToPlayBadge>
                  ) : null}
                  <ProfilePresenceBadges
                    badgeClassName={rankBadgeClassName}
                    isLookingToPlay={isLookingToPlay}
                  />
                </div>
              ) : null}
              <p className="mt-2 max-w-xl break-words text-[16px] leading-7 tracking-[-0.015em] text-zinc-300 [overflow-wrap:anywhere]">
                {bio || "This player has not added a bio yet."}
              </p>
            </div>

            <div className="sm:min-w-[220px]">
              <ProfileSocialLinks
                leadingAction={
                  isOwner ? (
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 backdrop-blur-md transition-all duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                    >
                      Edit profile
                    </button>
                  ) : null
                }
                links={socialLinks}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5 px-4 sm:px-6">
          <ProfileBadge className={rankBadgeClassName}>
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
        </div>
      </div>
    </section>
  );
}
