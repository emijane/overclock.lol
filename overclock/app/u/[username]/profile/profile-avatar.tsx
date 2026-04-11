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
        className="h-24 w-24 rounded-full border-[3px] border-zinc-900 bg-zinc-800 object-cover shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-zinc-900 bg-zinc-800 text-3xl font-semibold text-zinc-100 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      {displayName.slice(0, 1).toUpperCase()}
    </div>
  );
}
