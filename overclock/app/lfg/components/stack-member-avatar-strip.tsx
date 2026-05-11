import Link from "next/link";

import type { StackMember } from "@/lib/lfg/lfg-post-types";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
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
            className="group/member relative h-5 w-5 shrink-0"
            style={{ marginLeft: i === 0 ? 0 : "-0.3rem", zIndex: visible.length - i }}
          >
            {member.username ? (
              <Link
                href={`/u/${member.username}`}
                className="block h-5 w-5 overflow-hidden rounded-[7px] border border-black/70 bg-zinc-800 transition hover:border-white/16"
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
              <div className="h-5 w-5 overflow-hidden rounded-[7px] border border-black/70 bg-zinc-800">
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
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[7px] border border-white/[0.08] bg-[#090b0f]/96 px-2 py-1 text-[10px] font-medium text-zinc-300 shadow-[0_10px_24px_rgba(0,0,0,0.24)] group-hover/member:block">
              <span className="text-zinc-100">
                {member.username ? `@${member.username}` : member.displayName ?? "Player"}
              </span>
              {member.rankTier ? (
                <span className="text-zinc-500">
                  {" "}
                  - {formatCurrentRank(member.rankTier, member.rankDivision)}
                </span>
              ) : null}
            </div>
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
            className="relative h-5 w-5 shrink-0 rounded-[7px] border border-black/70 bg-zinc-800"
            style={{ marginLeft: "-0.3rem", zIndex: 0 }}
          >
            <span className="grid h-full w-full place-items-center text-[9px] font-bold text-zinc-300">
              +{overflow}
            </span>
          </div>
        ) : null}
      </div>
      {maxGroupSize ? (
        <span className="text-[11px] font-medium tracking-[-0.01em] text-zinc-400">
          {currentMemberCount}/{maxGroupSize}
        </span>
      ) : (
        <span className="text-[11px] font-medium tracking-[-0.01em] text-zinc-400">
          {currentMemberCount} member{currentMemberCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
