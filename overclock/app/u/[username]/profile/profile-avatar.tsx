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
        className="h-28 w-28 rounded-full border-[3px] border-zinc-900 bg-zinc-800 object-cover sm:h-32 sm:w-32"
      />
    );
  }

  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-zinc-900 bg-zinc-800 text-3xl font-semibold text-zinc-100 sm:h-32 sm:w-32 sm:text-[2.2rem]">
      {displayName.slice(0, 1).toUpperCase()}
    </div>
  );
}
