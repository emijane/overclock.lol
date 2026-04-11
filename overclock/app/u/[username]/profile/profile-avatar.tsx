type ProfileAvatarProps = {
  avatarUrl: string | null;
  displayName: string;
};

export function ProfileAvatar({
  avatarUrl,
  displayName,
}: ProfileAvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${displayName} avatar`}
        className="h-24 w-24 rounded-full border-[3px] border-white bg-[#fde2b2] object-cover shadow-[0_14px_34px_rgba(17,24,39,0.12)]"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-white bg-[#fde2b2] text-3xl font-semibold text-[#111827] shadow-[0_14px_34px_rgba(17,24,39,0.12)]">
      {displayName.slice(0, 1).toUpperCase()}
    </div>
  );
}
