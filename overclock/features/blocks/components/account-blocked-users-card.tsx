import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getBlockedUsers } from "@/lib/blocks/user-blocks";
import { UnblockUserButton } from "@/features/blocks/components/user-block-controls";

function getAvatarFallback(displayName: string | null, username: string | null) {
  const source = displayName ?? username ?? "U";
  return source.slice(0, 1).toUpperCase();
}

function formatBlockedAt(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export async function AccountBlockedUsersCard() {
  const blockedUsers = await getBlockedUsers();

  return (
    <div className="overflow-hidden">
      {blockedUsers.length === 0 ? (
        <div className="px-5 py-5 sm:px-6">
          <p className="oc-profile-display text-[14px] font-medium text-zinc-200">
            No blocked users yet.
          </p>
          <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-zinc-500">
            Use profile and post dropdowns to block a player when you need to.
          </p>
        </div>
      ) : (
        <div className="max-h-[25rem] overflow-y-auto">
          <ul>
            {blockedUsers.map((blockedUser, index) => {
              const primaryLabel = blockedUser.username
                ? `@${blockedUser.username} `
                : blockedUser.displayName ?? "Unknown user";
              const blockedAtLabel = formatBlockedAt(blockedUser.blockedAt);

              return (
                <li
                  key={blockedUser.profileId}
                  className={`${
                    index < blockedUsers.length - 1 ? "border-b border-white/[0.06]" : ""
                  }`}
                >
                  <div className="oc-list-row-hover flex items-center gap-3 px-5 py-4 sm:px-6">
                    <Avatar className="h-11 w-11 shrink-0 rounded-full border border-white/[0.06]">
                      {blockedUser.avatarUrl ? (
                        <AvatarImage
                          src={blockedUser.avatarUrl}
                          alt={`${primaryLabel.trim()} avatar`}
                        />
                      ) : null}
                      <AvatarFallback className="bg-zinc-900 text-xs text-zinc-100">
                        {getAvatarFallback(blockedUser.displayName, blockedUser.username)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="oc-profile-display truncate text-[14px] font-semibold tracking-[-0.02em] text-zinc-100">
                          {primaryLabel}
                        </p>
                        <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Blocked
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                        Hidden from invites, requests, and profile discovery on your account.
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {blockedAtLabel ? (
                          <p className="oc-profile-meta text-[11px] font-medium text-zinc-600">
                            Blocked {blockedAtLabel}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <UnblockUserButton
                        targetDisplayName={blockedUser.username ?? blockedUser.displayName ?? "user"}
                        targetProfileId={blockedUser.profileId}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
