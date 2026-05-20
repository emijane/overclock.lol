import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ProfileResultRowProps = {
  avatarClassName?: string;
  avatarUrl: string | null;
  className?: string;
  displayName: string | null;
  titleClassName?: string;
  username: string;
  usernameClassName?: string;
};

function getAvatarFallback(displayName: string | null, username: string) {
  return (displayName ?? username).slice(0, 1).toUpperCase();
}

export function ProfileResultRow({
  avatarClassName = "h-8 w-8",
  avatarUrl,
  className,
  displayName,
  titleClassName = "oc-profile-display truncate text-[13px] font-semibold text-zinc-100",
  username,
  usernameClassName = "oc-profile-meta truncate text-[11px]",
}: ProfileResultRowProps) {
  return (
    <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <Avatar className={[avatarClassName, "shrink-0 rounded-full"].join(" ")}>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={`${displayName ?? username} avatar`} /> : null}
        <AvatarFallback className="bg-zinc-900 text-xs text-zinc-100">
          {getAvatarFallback(displayName, username)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className={titleClassName}>{displayName ?? username}</p>
        <p className={usernameClassName}>@{username}</p>
      </div>
    </div>
  );
}
