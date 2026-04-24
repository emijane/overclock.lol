import { getRankBorderClassName } from "./rank-border-styles";

type ProfileAvatarProps = {
  avatarUrl: string | null;
  currentRankTier?: string | null;
  displayName: string;
};

export function ProfileAvatar({
  avatarUrl,
  currentRankTier,
  displayName,
}: ProfileAvatarProps) {
  const borderClassName = getRankBorderClassName(currentRankTier).replace(
    /\s*shadow-\[[^\]]+\]/g,
    ""
  );

  return (
    <div className="relative h-28 w-28 rounded-full sm:h-32 sm:w-32">
      <div
        className={`absolute -inset-[3px] rounded-full ${borderClassName}`}
        aria-hidden="true"
      />
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${displayName} avatar`}
          className="relative h-full w-full rounded-full bg-zinc-800 object-cover"
        />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center rounded-full bg-zinc-800 text-3xl font-semibold text-zinc-100 sm:text-[2.2rem]">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}
