"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { ProfileHeader } from "./profile-header";
import { ProfileEditModalShell } from "./profile-edit-modal-shell";

type EditableProfileHeaderProps = React.ComponentProps<typeof ProfileHeader>;

export function EditableProfileHeader(props: EditableProfileHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const pathname = usePathname();
  const socials = {
    battlenet:
      props.socialLinks.find((link) => link.platform === "battlenet")?.value ?? "",
    twitch:
      props.socialLinks.find((link) => link.platform === "twitch")?.value ?? "",
    x: props.socialLinks.find((link) => link.platform === "x")?.value ?? "",
    youtube:
      props.socialLinks.find((link) => link.platform === "youtube")?.value ?? "",
  };
  const discordUsername =
    props.socialLinks.find((link) => link.platform === "discord")?.value ?? null;

  return (
    <>
      <ProfileHeader
        {...props}
        onEditProfile={props.isOwner ? () => setIsEditModalOpen(true) : undefined}
      />
      {isEditModalOpen ? (
        <ProfileEditModalShell
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        profile={{
          bio: props.bio,
          currentRankDivision: props.currentRankDivision,
          currentRankTier: props.currentRankTier ?? null,
          discordUsername,
          displayName: props.displayName,
          hasDiscordUser: props.socialLinks.some(
            (link) => link.platform === "discord"
          ),
          lookingFor: props.lookingFor ?? [],
          platform: props.platform,
          region: props.region,
          returnTo: pathname,
          socials,
          timezone: props.timezone,
          }}
        />
      ) : null}
    </>
  );
}
