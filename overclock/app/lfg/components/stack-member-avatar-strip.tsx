import Link from "next/link";

import type { StackMember } from "@/lib/lfg/lfg-post-types";
import { RemoveStackMemberButton } from "./remove-stack-member-button";

type StackMemberAvatarStripProps = {
  currentProfileId?: string | null;
  currentMemberCount: number;
  maxGroupSize: number | null;
  members: StackMember[];
  postId?: string;
};

const MAX_VISIBLE_AVATARS = 4;

export function StackMemberAvatarStrip({
  currentProfileId,
  currentMemberCount,
  maxGroupSize,
  members,
  postId,
}: StackMemberAvatarStripProps) {
  const visible = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = members.length - MAX_VISIBLE_AVATARS;
  const ownerProfileId = members.find((member) => member.isOwner)?.profileId ?? null;
  const canManageMembers = Boolean(
    postId && ownerProfileId && currentProfileId && ownerProfileId === currentProfileId
  );

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {visible.map((member, i) => (
          <div
            key={member.profileId}
            title={member.displayName ?? member.username ?? "Member"}
            aria-label={member.displayName ?? member.username ?? "Member"}
            className="relative h-6 w-6 shrink-0"
            style={{ marginLeft: i === 0 ? 0 : "-0.375rem", zIndex: visible.length - i }}
          >
            {member.username ? (
              <Link
                href={`/u/${member.username}`}
                className="block h-6 w-6 overflow-hidden rounded-full border border-[#05070b] bg-zinc-800 transition hover:border-white/15"
              >
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName ?? member.username ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[9px] font-bold text-zinc-300">
                    {(member.displayName ?? member.username ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </Link>
            ) : (
              <div className="h-6 w-6 overflow-hidden rounded-full border border-[#05070b] bg-zinc-800">
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName ?? member.username ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[9px] font-bold text-zinc-300">
                    {(member.displayName ?? member.username ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
            )}
            {canManageMembers && !member.isOwner && postId ? (
              <RemoveStackMemberButton
                memberProfileId={member.profileId}
                postId={postId}
              />
            ) : null}
          </div>
        ))}
        {overflow > 0 ? (
          <div
            className="relative h-6 w-6 shrink-0 rounded-full border border-[#05070b] bg-zinc-800"
            style={{ marginLeft: "-0.375rem", zIndex: 0 }}
          >
            <span className="grid h-full w-full place-items-center text-[9px] font-bold text-zinc-300">
              +{overflow}
            </span>
          </div>
        ) : null}
      </div>
      {maxGroupSize ? (
        <span className="text-[11px] font-medium text-zinc-500">
          {currentMemberCount}/{maxGroupSize}
        </span>
      ) : (
        <span className="text-[11px] font-medium text-zinc-500">
          {currentMemberCount} member{currentMemberCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
