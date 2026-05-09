"use client";

import { updateProfile } from "@/app/account/actions";
import { AvatarUploadButton } from "@/app/account/avatar-upload-button";
import { ProfileCoverUploadButton } from "@/app/u/[username]/profile/profile-cover-upload-button";
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

      {/* Cover + avatar preview */}
      <div className="relative mb-10">
        <div className="relative h-24 overflow-hidden rounded-t-[21px]">
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
          <div className="absolute bottom-2 right-2">
            <ProfileCoverUploadButton />
          </div>
        </div>
        <div className="absolute -bottom-8 left-4 sm:left-5">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[#05070b] bg-zinc-800">
            <AvatarUploadButton avatarUrl={avatarUrl} initial={initial} />
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="px-4 pb-4 sm:px-5">
        <ProfileEditFormFields form={form} profile={profile} />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/8 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/12 hover:text-white"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}
