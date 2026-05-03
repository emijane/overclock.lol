import { getRankBorderClassName } from "@/lib/competitive/rank-border-styles";

type RankedAvatarProps = {
  avatarUrl: string | null;
  className?: string;
  displayName: string;
  fallbackClassName?: string;
  fallbackText?: string;
  imageClassName?: string;
  rankTier?: string | null;
  ringClassName?: string;
};

export function RankedAvatar({
  avatarUrl,
  className = "h-10 w-10",
  displayName,
  fallbackClassName = "text-sm font-semibold text-zinc-100",
  fallbackText,
  imageClassName = "",
  rankTier,
  ringClassName = "-inset-[2px] opacity-75",
}: RankedAvatarProps) {
  const borderClassName = getRankBorderClassName(rankTier).replace(
    /\s*shadow-\[[^\]]+\]/g,
    ""
  );
  const resolvedFallbackText =
    fallbackText ?? displayName.slice(0, 1).toUpperCase();

  return (
    <div className={`relative rounded-full ${className}`}>
      <div
        className={`absolute ${ringClassName} rounded-full ${borderClassName}`}
        aria-hidden="true"
      />
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${displayName} avatar`}
          className={`relative h-full w-full rounded-full bg-zinc-800 object-cover ${imageClassName}`.trim()}
        />
      ) : (
        <div
          className={`relative flex h-full w-full items-center justify-center rounded-full bg-zinc-800 ${fallbackClassName}`.trim()}
        >
          {resolvedFallbackText}
        </div>
      )}
    </div>
  );
}
