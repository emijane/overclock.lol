"use client";

import { updateProfile } from "@/features/profile/actions";
import { AvatarUploadButton } from "@/features/profile/components/avatar-upload-button";
import { ProfileCoverUploadButton } from "@/features/profile/components/profile-cover-upload-button";
import { ProfileEditFormFields } from "@/features/profile/components/profile-edit-form-fields";
import { useProfileEditForm } from "@/features/profile/hooks/use-profile-edit-form";
import type { ProfileEditProfile } from "@/features/profile/types/profile-edit-types";

type ProfileEditFormProps = {
  avatarUrl: string | null;
  coverImageUrl: string | null;
  profile: ProfileEditProfile;
};

export function ProfileEditForm({ avatarUrl, coverImageUrl, profile }: ProfileEditFormProps) {
  const form = useProfileEditForm(profile);
  const initial = profile.displayName.slice(0, 1).toUpperCase();

  return (
    <form action={updateProfile}>
      <input type="hidden" name="return_to" value="/account" />
      {profile.lookingFor.map((option) => (
        <input key={option} type="hidden" name="looking_for" value={option} />
      ))}
      <input type="hidden" name="twitch_url" value={form.twitchUrl} />
      <input type="hidden" name="x_url" value={form.xUrl} />
      <input type="hidden" name="youtube_url" value={form.youtubeUrl} />

      <div className="border-b border-white/[0.05] px-5 py-4 sm:px-6 sm:py-4.5">
        <div className="relative overflow-hidden rounded-[16px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.018)_0%,rgba(255,255,255,0.008)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="relative h-24">
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-linear-to-b from-[#0f1117] to-[#05070b]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(5,7,11,0.24)_58%,rgba(5,7,11,0.82)_100%)]" />
            <div className="absolute bottom-2.5 right-2.5">
              <ProfileCoverUploadButton />
            </div>
          </div>

          <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-end sm:justify-between sm:px-5 sm:py-4">
            <div className="flex items-end gap-3">
              <div className="h-18 w-18 overflow-hidden rounded-full border-2 border-[#05070b] bg-zinc-800 shadow-[0_10px_22px_rgba(0,0,0,0.26)]">
                <AvatarUploadButton avatarUrl={avatarUrl} initial={initial} />
              </div>
              <div className="pb-1">
                <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  Public identity
                </p>
                <p className="mt-1 font-mono text-[13px] font-semibold text-zinc-50">
                  Profile basics
                </p>
                <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                  Update the visuals and details tied to your public player page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6 sm:py-4.5">
        <ProfileEditFormFields form={form} profile={profile} variant="settings" />
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="oc-profile-display inline-flex h-9 items-center rounded-[10px] border border-white/[0.08] bg-white/[0.05] px-4 text-[13px] font-semibold text-zinc-100 transition hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-white"
          >
            Save changes
          </button>
        </div>
      </div>
    </form>
  );
}
