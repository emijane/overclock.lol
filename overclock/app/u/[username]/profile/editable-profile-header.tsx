"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ProfileHeader } from "./profile-header";
import { ProfileEditModalShell } from "./profile-edit-modal-shell";
import type { SocialValues } from "./profile-edit-types";

type EditableProfileHeaderProps = React.ComponentProps<typeof ProfileHeader>;

export function EditableProfileHeader(props: EditableProfileHeaderProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const socials: SocialValues = {
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
  const shouldOpenEditModal = props.isOwner && searchParams.get("edit") === "profile";
  const isModalOpen = isEditModalOpen || shouldOpenEditModal;

  function handleCloseEditModal() {
    setIsEditModalOpen(false);

    if (searchParams.get("edit") === "profile") {
      router.replace(pathname, { scroll: false });
    }
  }

  return (
    <>
      <ProfileHeader
        {...props}
        onEditProfile={props.isOwner ? () => setIsEditModalOpen(true) : undefined}
      />
      {isModalOpen ? (
        <ProfileEditModalShell
          isOpen={isModalOpen}
          onClose={handleCloseEditModal}
        profile={{
          bio: props.bio,
          discordUsername,
          displayName: props.displayName,
          lookingFor: props.lookingFor ?? [],
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
