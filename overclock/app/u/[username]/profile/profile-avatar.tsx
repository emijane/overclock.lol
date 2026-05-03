import { RankedAvatar } from "@/app/components/ranked-avatar";

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
  return (
    <RankedAvatar
      avatarUrl={avatarUrl}
      className="h-28 w-28 sm:h-32 sm:w-32"
      displayName={displayName}
      fallbackClassName="text-3xl font-semibold text-zinc-100 sm:text-[2.2rem]"
      rankTier={currentRankTier}
      ringClassName="-inset-[3px] opacity-75"
    />
  );
}
