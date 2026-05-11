import type React from "react";
import Image from "next/image";
import { Clock3Icon, Globe2Icon } from "lucide-react";

import { ProfileAvatar } from "./profile-avatar";
import { ProfileBadge } from "./profile-badge";
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
    <section className="bg-transparent">
      <div className="pb-4 sm:pb-5">
        <div
          className="relative overflow-hidden px-4 py-3 sm:px-6"
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
                className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#090909] via-[#090909]/60 to-transparent"
                aria-hidden="true"
              />
            </>
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#111111] via-[#0d0d0d] to-[#090909]"
              aria-hidden="true"
            />
          )}
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <span className="oc-profile-meta inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.04] bg-[#090909]/74 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-200">
                <span className="text-zinc-500">Connections</span>
                <span className="oc-profile-display text-[13px] font-semibold text-zinc-100">
                  {connectionCount}
                </span>
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              {platform ? (
                <span className="oc-profile-meta inline-flex items-center rounded-[10px] border border-white/[0.04] bg-[#090909]/74 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-200">
                  {platform}
                </span>
              ) : null}
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

        <div className="pointer-events-none relative z-20 -mt-[3.25rem] px-4 sm:-mt-[3.75rem] sm:px-6">
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

        <div className="mt-4 px-4 sm:-mt-9 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="h-3 sm:h-14" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="oc-profile-display text-[28px] font-bold leading-[0.98] tracking-[-0.045em] text-zinc-50 sm:text-[36px]">
                  {displayName}
                </h1>
                {currentRankIconSrc && currentRank ? (
                  <Image
                    src={currentRankIconSrc}
                    alt={`${currentRank} rank icon`}
                    width={44}
                    height={44}
                    className="h-6 w-6 object-contain sm:h-7 sm:w-7"
                  />
                ) : null}
              </div>
              <p className="oc-profile-meta mt-0.5 text-[12px] font-medium tracking-[0.01em]">
                @{username}
              </p>
              {bio ? (
                <p className="mt-1.5 max-w-xl break-words text-[15px] leading-6 tracking-[-0.015em] text-zinc-300 [overflow-wrap:anywhere]">
                  {bio}
                </p>
              ) : null}

              {(platform || isLookingToPlay) ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {isLookingToPlay ? (
                    <span className="oc-profile-meta inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-sky-300">
                      <span className="relative flex h-1.25 w-1.25">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                        <span className="relative inline-flex h-1.25 w-1.25 rounded-full bg-sky-400" />
                      </span>
                      Looking to play
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="sm:min-w-[220px] sm:pt-0.5">
              <ProfileSocialLinks
                leadingAction={
                  isOwner ? (
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="oc-profile-display oc-profile-text-button inline-flex h-8 items-center px-3 text-[12px] font-semibold text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
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
