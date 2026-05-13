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
    <section className="overflow-hidden rounded-[12px] border border-white/[0.07] bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_10px_22px_rgba(0,0,0,0.18)]">
      <div className="border-b border-white/[0.06] px-4 py-3 sm:px-4.5">
        <h2 className="oc-profile-display text-[16px] font-semibold tracking-[-0.03em] text-zinc-50">
          Blocked users
        </h2>
        <p className="mt-1 text-[13px] leading-6 text-zinc-400">
          Manage the players you do not want interacting with your account.
        </p>
      </div>

      {blockedUsers.length === 0 ? (
        <div className="px-4 py-4.5 sm:px-4.5 sm:py-5">
          <p className="oc-profile-display text-[14px] font-medium text-zinc-200">
            No blocked users yet.
          </p>
          <p className="mt-1 text-[13px] leading-6 text-zinc-500">
            Use profile and post dropdowns to block a player when you need to.
          </p>
        </div>
      ) : (
        <div className="max-h-[26rem] overflow-y-auto">
          <ul>
            {blockedUsers.map((blockedUser, index) => {
              const primaryLabel = blockedUser.username
                ? `@${blockedUser.username} `
                : blockedUser.displayName ?? "Unknown user";
              const blockedAtLabel = formatBlockedAt(blockedUser.blockedAt);

              return (
                <li
                  key={blockedUser.profileId}
                  className={index < blockedUsers.length - 1 ? "border-b border-white/[0.06]" : ""}
                >
                  <div className="flex items-center gap-3 px-4 py-3 sm:px-4.5">
                    <Avatar className="h-10 w-10 shrink-0 rounded-full">
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
                      <p className="oc-profile-display truncate text-[14px] font-semibold tracking-[-0.02em] text-zinc-100">
                        {primaryLabel}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {blockedUser.displayName && blockedUser.username ? (
                          <p className="oc-profile-meta truncate text-[11px] font-medium text-zinc-500">
                            {blockedUser.displayName}
                          </p>
                        ) : null}
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
    </section>
  );
}
