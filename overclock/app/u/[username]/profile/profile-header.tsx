import Image from "next/image";
import { Clock3Icon, Globe2Icon } from "lucide-react";
import { FaComputerMouse } from "react-icons/fa6";
import { IoGameController } from "react-icons/io5";

import { ProfileAvatar } from "./profile-avatar";
import { ProfileBadge } from "./profile-badge";
import { ProfileCoverUploadButton } from "./profile-cover-upload-button";
import { ProfileSocialLinks } from "./profile-social-links";
import { PROFILE_COVER_ASPECT_RATIO } from "@/lib/profiles/profile-media";

type ProfileHeaderProps = {
  avatarUrl: string | null;
  bio: string | null;
  coverImageUrl: string | null;
  currentRank: string | null;
  currentRankTier?: string | null;
  currentRankIconSrc: string | null;
  currentRankPill: string;
  currentRankDivision?: number | null;
  displayName: string;
  isOwner: boolean;
  lookingFor?: string[] | null;
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
  onEditProfile?: () => void;
};

export function ProfileHeader({
  avatarUrl,
  bio,
  coverImageUrl,
  currentRank,
  currentRankIconSrc,
  currentRankPill,
  displayName,
  isOwner,
  platform,
  region,
  roleLabels,
  socialLinks,
  timezone,
  username,
  onEditProfile,
}: ProfileHeaderProps) {
  const PlatformIcon = platform === "PC" ? FaComputerMouse : IoGameController;

  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900">
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
              className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950"
              aria-hidden="true"
            />
          )}

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              {isOwner ? <ProfileCoverUploadButton /> : null}
            </div>

            <div className="flex items-start gap-2">
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
          </div>
        </div>

        <div className="pointer-events-none relative z-20 -mt-14 px-4 sm:-mt-16 sm:px-6">
          <div className="pointer-events-auto w-fit">
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
              <p className="mt-3 max-w-xl break-words text-[17px] leading-7 tracking-[-0.015em] text-zinc-300 [overflow-wrap:anywhere]">
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
                      className="inline-flex h-10 items-center rounded-full border border-zinc-700 bg-zinc-950/75 px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-900"
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
