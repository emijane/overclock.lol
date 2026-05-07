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
    <form action={updateProfile}>
      <input type="hidden" name="return_to" value="/account" />
      {profile.lookingFor.map((option) => (
        <input key={option} type="hidden" name="looking_for" value={option} />
      ))}
      <input type="hidden" name="twitch_url" value={form.twitchUrl} />
      <input type="hidden" name="x_url" value={form.xUrl} />
      <input type="hidden" name="youtube_url" value={form.youtubeUrl} />

      <ProfileEditFormFields form={form} profile={profile} />

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full bg-sky-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-300"
        >
          Save
        </button>
      </div>
    </form>
  );
}
