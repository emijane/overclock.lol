import type React from "react";
import Image from "next/image";
import { Clock3Icon, Globe2Icon } from "lucide-react";

import { ProfileAvatar } from "./profile-avatar";
import { ProfileBadge } from "./profile-badge";
import { ProfileCoverUploadButton } from "./profile-cover-upload-button";
import { ProfileSocialLinks } from "./profile-social-links";
import type { ProfileBadge as UserProfileBadge } from "@/lib/badges/badge-types";
import { PROFILE_COVER_ASPECT_RATIO } from "@/lib/profiles/profile-media";

type ProfileHeaderProps = {
  avatarUrl: string | null;
  badges?: UserProfileBadge[];
  bio: string | null;
  connectionCount?: number;
  coverImageUrl: string | null;
  currentRank: string | null;
  currentRankTier?: string | null;
  currentRankIconSrc: string | null;
  displayName: string;
  hideOfflinePresence?: boolean | null;
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
  profileAction?: React.ReactNode;
};


export function ProfileHeader({
  avatarUrl,
  bio,
  connectionCount = 0,
  coverImageUrl,
  currentRank,
  currentRankIconSrc,
  currentRankTier,
  displayName,
  hideOfflinePresence,
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
  profileAction,
}: ProfileHeaderProps) {
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
              <div
                className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#05070b] via-[#05070b]/60 to-transparent"
                aria-hidden="true"
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
              hideOfflinePresence={hideOfflinePresence}
              isLookingToPlay={isLookingToPlay}
              lastSeenAt={lastSeenAt}
              userId={id}
            />
          </div>
        </div>

        <div className="mt-6 px-4 sm:-mt-10 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <div className="sm:h-14" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[29px] font-semibold leading-[1.02] tracking-[-0.045em] text-zinc-50 sm:text-[31px]">
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
              <p className="mt-0.5 text-[14px] font-medium tracking-[-0.01em] text-zinc-600">
                @{username}
              </p>
              <p className="mt-1.5 max-w-xl break-words text-[16px] leading-7 tracking-[-0.015em] text-zinc-300 [overflow-wrap:anywhere]">
                {bio || "This player has not added a bio yet."}
              </p>

              <div className="mt-3">
                <span className="text-sm font-semibold text-zinc-100">
                  {connectionCount}
                </span>
                <span className="ml-1 text-sm text-zinc-500">
                  {connectionCount === 1 ? "Connection" : "Connections"}
                </span>
              </div>

              {(platform || isLookingToPlay) ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {platform ? (
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300">
                      {platform}
                    </span>
                  ) : null}
                  {isLookingToPlay ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-xs font-medium text-sky-300">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
                      </span>
                      Looking to play
                    </span>
                  ) : null}
                </div>
              ) : null}
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
                  ) : (
                    profileAction ?? null
                  )
                }
                links={socialLinks}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
