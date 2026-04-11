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
        className="h-24 w-24 rounded-full border-4 border-[#ffffff] bg-[#fde2b2] object-cover"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#ffffff] bg-[#fde2b2] text-3xl font-semibold text-[#111827]">
      {displayName.slice(0, 1).toUpperCase()}
    </div>
  );
}
