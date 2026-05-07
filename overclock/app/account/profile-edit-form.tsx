"use client";

import { updateProfile } from "@/app/account/actions";
import { ProfileEditFormFields } from "@/app/u/[username]/profile/profile-edit-form-fields";
import { useProfileEditForm } from "@/app/u/[username]/profile/use-profile-edit-form";
import type { ProfileEditProfile } from "@/app/u/[username]/profile/profile-edit-types";

type ProfileEditFormProps = {
  profile: ProfileEditProfile;
};

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const form = useProfileEditForm(profile);

  return (
    <form action={updateProfile} className="px-4 py-4 sm:px-5">
      <input type="hidden" name="return_to" value="/account" />
      {profile.lookingFor.map((option) => (
        <input key={option} type="hidden" name="looking_for" value={option} />
      ))}
      <input type="hidden" name="twitch_url" value={form.twitchUrl} />
      <input type="hidden" name="x_url" value={form.xUrl} />
      <input type="hidden" name="youtube_url" value={form.youtubeUrl} />

      <ProfileEditFormFields form={form} profile={profile} />

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-full bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Save
        </button>
      </div>
    </form>
  );
}
