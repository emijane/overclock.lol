import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { SiBattledotnet } from "react-icons/si";

import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { AuthMessage } from "@/components/auth/auth-message";
import { PresenceIndicator } from "@/components/presence/presence-indicator";
import { RankedAvatar } from "@/components/profile/ranked-avatar";
import { closeLFGPost } from "@/features/lfg/actions";
import type { CompetitiveRole } from "@/lib/competitive/competitive-profile-types";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getLFGGameModeLabel } from "@/lib/lfg/lfg-post-types";
import {
  deriveStackDetailViewerState,
  getStackInactiveStateCopy,
} from "@/lib/lfg/stack-detail-state";
import { computeStackRoleNeeds } from "@/lib/lfg/stack-role-needs";
import {
  getStackMemberContactInfoForViewer,
  getStackPostDetailById,
  type StackMemberContactInfo,
  type StackPostDetail,
} from "@/lib/lfg/posts/posts-queries";
import {
  getIncomingPendingStackRequests,
  getStackRequestStateForPost,
} from "@/lib/lfg/stack-requests";
import { stacksPerfLog, stacksPerfStart } from "@/lib/dev/perf-log";
import { getCurrentUserId } from "@/lib/profiles/get-current-profile";

import { CopyStackLinkButton } from "./copy-stack-link-button";
import { RemoveStackMemberButton } from "./remove-stack-member-button";
import { RequestToJoinButton } from "./request-to-join-button";
import { StackDetailPendingRequests } from "./stack-detail-pending-requests";

type StackDetailPageProps = {
  message?: string;
  messageType?: string;
  postId: string;
};

function getRoleChipClassName(role: CompetitiveRole) {
  if (role === "tank") return "border-sky-400/14 bg-sky-400/6 text-sky-100/80";
  if (role === "dps") return "border-rose-400/14 bg-rose-400/6 text-rose-100/80";
  return "border-emerald-400/14 bg-emerald-400/6 text-emerald-100/80";
}

function EmptyDetailState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-[10px] border border-white/6 bg-white/2 px-5 py-8 text-center sm:px-6">
      <h2 className="oc-profile-display text-[20px] font-semibold tracking-[-0.03em] text-zinc-50">
        {title}
      </h2>
      <p className="oc-profile-meta mx-auto mt-2 max-w-xl text-[11px] leading-5 text-zinc-400">
        {description}
      </p>
      <div className="mt-5">
        <Link
          href="/stacks"
          className="oc-profile-display inline-flex h-9 items-center rounded-[10px] border border-white/6 bg-white/3 px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-50"
        >
          Back to Stacks
        </Link>
      </div>
    </section>
  );
}

function StackSummaryHeader({
  currentProfileId,
  detail,
  isAcceptedMember,
  isOwner,
  requestState,
}: {
  currentProfileId: string | null;
  detail: StackPostDetail;
  isAcceptedMember: boolean;
  isOwner: boolean;
  requestState: "none" | "pending" | "accepted" | "declined";
}) {
  const post = detail.post;
  const owner = post.stackMembers.find((m) => m.isOwner) ?? null;
  const ownerLabel =
    owner?.displayName ??
    owner?.username ??
    post.author.displayName ??
    post.author.username ??
    "Player";
  const ownerHref =
    owner?.username
      ? `/u/${owner.username}`
      : post.author.username
        ? `/u/${post.author.username}`
        : null;
  const openSpots = Math.max(
    (post.maxGroupSize ?? post.currentMemberCount) - post.currentMemberCount,
    0
  );
  const statusLabel = detail.isActive
    ? post.status === "filled"
      ? "Filled"
      : null
    : post.status === "closed"
      ? "Closed"
      : "Expired";
  const isFull =
    post.currentMemberCount >= (post.maxGroupSize ?? 5) || post.status === "filled";
  const roleNeeds = computeStackRoleNeeds(post.stackMembers);
  const viewerState = currentProfileId ? "authenticated" : "guest";
  const visibleName =
    post.author.username ?? post.author.displayName ?? owner?.username ?? ownerLabel;

  return (
    <section className="rounded-[10px] border border-white/6 bg-white/2">
      <div className="pb-4 pt-0 sm:pb-5 sm:pt-0">
        <div className="flex flex-col gap-3">
          <div>
            <div className="relative h-24 overflow-hidden rounded-t-[9px] border-b border-white/6 bg-zinc-950/95 sm:h-25">
                {post.author.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.author.coverImageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute right-4 top-3 z-10 flex items-center gap-2 sm:right-5">
                  <CopyStackLinkButton path={`/stacks/${post.id}`} />
                  {isOwner && detail.isActive ? (
                    <form action={closeLFGPost}>
                      <input type="hidden" name="post_id" value={post.id} />
                      <input type="hidden" name="return_path" value={`/stacks/${post.id}`} />
                      <button
                        type="submit"
                        className="oc-profile-display inline-flex h-7 items-center rounded-[10px] border border-rose-500/20 bg-black/55 px-2.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm transition hover:border-rose-500/30 hover:bg-black/70 hover:text-zinc-50"
                      >
                        Close stack
                      </button>
                    </form>
                  ) : null}
                </div>
            </div>

            <div className="px-4 sm:px-5">
              <div className="mb-2.5 flex min-w-0 items-end gap-3 pt-0.5">
                <RankedAvatar
                  avatarUrl={post.author.avatarUrl}
                  className="-mt-[3rem] h-[68px] w-[68px] shrink-0 rounded-full shadow-[0_18px_36px_-14px_rgba(0,0,0,0.7)]"
                  displayName={visibleName}
                  fallbackClassName="text-xs font-semibold text-zinc-100"
                  fallbackText={visibleName.slice(0, 2).toUpperCase()}
                  overlay={
                    post.profileId ? (
                      <PresenceIndicator
                        className="oc-overlay-avatar-elevated absolute bottom-0.5 right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                        hideOfflinePresence={post.author.hideOfflinePresence}
                        isLookingToPlay={post.author.isLookingToPlay}
                        lastSeenAt={post.author.lastSeenAt}
                        sizeClassName="h-2.5 w-2.5"
                        userId={post.profileId}
                      />
                    ) : null
                  }
                  rankTier={post.rankTier}
                  ringClassName="hidden"
                />
              </div>

              <div className="flex items-start gap-3">
                <h1 className="oc-profile-display min-w-0 text-[22px] font-semibold leading-[1.1] tracking-[-0.04em] text-zinc-50 sm:text-[26px]">
                  {post.title}
                </h1>
              </div>
              <div className="oc-profile-meta mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
              <span>
                Created by{" "}
                {ownerHref ? (
                  <Link
                    href={ownerHref}
                    className="font-medium text-zinc-300 transition hover:text-zinc-100"
                  >
                    {ownerLabel}
                  </Link>
                ) : (
                  <span className="font-medium text-zinc-300">{ownerLabel}</span>
                )}
              </span>
              <span aria-hidden="true" className="text-zinc-700">&bull;</span>
              <span>{getLFGGameModeLabel(post.gameMode)}</span>
              {post.region ? (
                <>
                  <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                  <span>{post.region}</span>
                </>
              ) : null}
              {statusLabel ? (
                <>
                  <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                  <span>{statusLabel}</span>
                </>
              ) : null}
              </div>
            </div>
          </div>

          {roleNeeds.size > 0 ? (
            <div className="px-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-1.5">
              <span className="oc-profile-meta text-[10px] text-zinc-500">Needs</span>
              {Array.from(roleNeeds.entries()).map(([role, count]) => (
                <span
                  key={role}
                  className={`oc-profile-pill border px-2 py-0.5 text-[10px] font-medium ${getRoleChipClassName(role)}`}
                >
                  {count} {COMPETITIVE_ROLE_LABELS[role]}
                </span>
              ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="oc-profile-meta text-[12px] font-medium text-zinc-300">
                  {post.currentMemberCount}/{post.maxGroupSize ?? post.currentMemberCount} members
                </span>
                {openSpots === 0 ? (
                  <span className="oc-profile-pill border border-white/6 bg-white/3 px-2 py-0.5 text-[10px] text-zinc-400">
                    Full
                  </span>
                ) : null}
              </div>

            {detail.isActive && !isOwner && !isAcceptedMember ? (
              !isFull || requestState === "pending" ? (
                <RequestToJoinButton
                  guestNextHref={`/stacks/${post.id}`}
                  initialState={requestState === "pending" ? "pending" : requestState === "declined" ? "declined" : "none"}
                  roleOptions={post.lookingForRoles}
                  postId={post.id}
                  tone="duos"
                  viewerState={viewerState}
                />
              ) : (
                <span className="oc-profile-meta inline-flex h-7 items-center rounded-full border border-white/6 bg-white/3 px-2.5 text-[11px] font-medium text-zinc-500">
                  Stack full
                </span>
              )
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function MemberList({
  contactInfoByProfileId,
  currentProfileId,
  detail,
}: {
  contactInfoByProfileId: Map<string, StackMemberContactInfo> | null;
  currentProfileId: string | null;
  detail: StackPostDetail;
}) {
  const ownerProfileId =
    detail.post.stackMembers.find((member) => member.isOwner)?.profileId ?? null;
  const canManageMembers = Boolean(
    detail.isActive && ownerProfileId && currentProfileId && ownerProfileId === currentProfileId
  );

  return (
    <section className="rounded-[10px] border border-white/6 bg-white/2">
      <div className="px-4 py-4 sm:px-5 sm:py-4.5">
        <p className="oc-profile-meta mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Current members
        </p>

        <div className="space-y-2.5">
          {detail.post.stackMembers.map((member) => {
            const memberLabel = member.displayName ?? member.username ?? "Player";
            const memberHref = member.username ? `/u/${member.username}` : null;
            const roleLabel = COMPETITIVE_ROLE_LABELS[member.role];
            const contact = contactInfoByProfileId?.get(member.profileId) ?? null;

            return (
              <div
                key={member.profileId}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-white/5 bg-black/12 px-4 py-3"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/8 bg-zinc-900">
                    {member.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.avatarUrl}
                        alt={memberLabel}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[11px] font-semibold text-zinc-200">
                        {memberLabel.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      {memberHref ? (
                        <Link
                          href={memberHref}
                          className="oc-profile-display truncate text-[14px] font-semibold text-zinc-100 transition hover:text-white"
                        >
                          {memberLabel}
                        </Link>
                      ) : (
                        <p className="oc-profile-display truncate text-[14px] font-semibold text-zinc-100">
                          {memberLabel}
                        </p>
                      )}
                      {member.username ? (
                        <span className="oc-profile-meta truncate text-[11px] text-zinc-500">
                          @{member.username}
                        </span>
                      ) : null}
                    </div>
                    <p className="oc-profile-meta mt-0.5 text-[11px] leading-5 text-zinc-400">
                      {roleLabel}
                      {member.isOwner ? " · owner" : ""}
                    </p>
                    {contact && (contact.discordUsername || contact.battlenetHandle) ? (
                      <div className="oc-profile-meta mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                        {contact.discordUsername ? (
                          <span className="flex items-center gap-1">
                            <FaDiscord className="oc-social-discord h-3 w-3 shrink-0" />
                            <span className="text-zinc-400">{contact.discordUsername}</span>
                          </span>
                        ) : null}
                        {contact.battlenetHandle ? (
                          <span className="flex items-center gap-1">
                            <SiBattledotnet className="oc-social-battlenet h-3 w-3 shrink-0" />
                            <span className="text-zinc-400">{contact.battlenetHandle}</span>
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                {canManageMembers && !member.isOwner ? (
                  <RemoveStackMemberButton
                    className="oc-profile-meta inline-flex h-8 items-center rounded-[10px] border border-white/6 bg-white/3 px-3 text-[11px] font-medium text-zinc-400 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                    label="Remove"
                    memberProfileId={member.profileId}
                    postId={detail.post.id}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export async function StackDetailPage({
  message,
  messageType,
  postId,
}: StackDetailPageProps) {
  const tPage = stacksPerfStart();
  const tViewer = stacksPerfStart();
  const currentProfileId = await getCurrentUserId();
  stacksPerfLog("StackDetailPage getCurrentUserId", tViewer, currentProfileId ? 1 : 0);
  const tDetail = stacksPerfStart();
  const detail = await getStackPostDetailById(postId, currentProfileId);
  stacksPerfLog("StackDetailPage getStackPostDetailById", tDetail, detail ? 1 : 0);

  if (!detail) {
    stacksPerfLog("StackDetailPage total data load", tPage, 0);
    return (
      <main className="oc-atmosphere-bg relative flex-1 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
        <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />
        <AuthMessage message={message} type={messageType} variant="toast" />
        <PageContainer className="relative z-10 flex flex-col gap-4" maxWidthClassName="max-w-[59rem]">
          <PageReveal className="flex flex-col gap-4">
            <Link
              href="/stacks"
              className="oc-profile-meta inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-zinc-300"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
              Stacks
            </Link>
            <EmptyDetailState
              description="The stack may have been deleted, hidden, or cleaned up after its retention window."
              title="We couldn't find that stack"
            />
          </PageReveal>
        </PageContainer>
      </main>
    );
  }

  const {
    isAcceptedMember,
    isOwner,
    shouldFetchContactInfo,
    shouldFetchIncomingRequests,
    shouldFetchRequestState,
  } = deriveStackDetailViewerState({
    currentProfileId,
    detail,
  });
  const profileId = currentProfileId;

  const tViewerQueries = stacksPerfStart();
  const [requestState, pendingRequests, memberContactInfo] = await Promise.all([
    profileId && shouldFetchRequestState
      ? getStackRequestStateForPost({
          currentProfileId: profileId,
          postId: detail.post.id,
        }).catch(() => "none" as const)
      : Promise.resolve("none" as const),
    profileId && shouldFetchIncomingRequests
      ? getIncomingPendingStackRequests({
          currentProfileId: profileId,
          postId: detail.post.id,
        }).then((r) => r.requests)
      : Promise.resolve([]),
    profileId && shouldFetchContactInfo
      ? getStackMemberContactInfoForViewer({
          postId: detail.post.id,
          viewerProfileId: profileId,
        })
      : Promise.resolve(null),
  ]);
  stacksPerfLog(
    "StackDetailPage viewer queries",
    tViewerQueries,
    pendingRequests.length
  );
  stacksPerfLog("StackDetailPage total data load", tPage, detail.post.stackMembers.length);

  return (
    <main className="oc-atmosphere-bg relative flex-1 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />
      <AuthMessage message={message} type={messageType} variant="toast" />

      <PageContainer className="relative z-10 flex flex-col gap-4" maxWidthClassName="max-w-[59rem]">
        <PageReveal className="flex flex-col gap-4">
          <Link
            href="/stacks"
            className="oc-profile-meta inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-zinc-300"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
            Stacks
          </Link>

          {!detail.isActive ? (
            <section className="rounded-[10px] border border-amber-500/20 bg-amber-500/5">
              <div className="px-5 py-4 sm:px-6 sm:py-4.5">
                <h2 className="oc-profile-display text-[18px] font-semibold tracking-[-0.03em] text-zinc-50">
                  {getStackInactiveStateCopy(detail).title}
                </h2>
                <p className="oc-profile-meta mt-2 max-w-2xl text-[11px] leading-5 text-zinc-300">
                  {getStackInactiveStateCopy(detail).description}
                </p>
                <div className="mt-4">
                  <Link
                    href="/stacks"
                    className="oc-profile-display inline-flex h-9 items-center rounded-[10px] border border-white/6 bg-white/3 px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-50"
                  >
                    Back to Stacks
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          <StackSummaryHeader
            currentProfileId={currentProfileId}
            detail={detail}
            isAcceptedMember={isAcceptedMember}
            isOwner={isOwner}
            requestState={requestState}
          />

          <div className={isOwner && detail.isActive && pendingRequests.length > 0 ? "grid gap-4 xl:grid-cols-2" : ""}>
            <MemberList
              contactInfoByProfileId={memberContactInfo}
              currentProfileId={currentProfileId}
              detail={detail}
            />

            {isOwner && detail.isActive && pendingRequests.length > 0 ? (
              <section className="rounded-[10px] border border-white/6 bg-white/2">
                <div className="px-4 py-4 sm:px-5 sm:py-4.5">
                  <div className="mb-3 flex items-center gap-2">
                    <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Pending requests
                    </p>
                    <span className="oc-profile-pill border border-white/6 bg-white/3 px-2 py-0.5 text-[10px] text-zinc-300">
                      {pendingRequests.length}
                    </span>
                  </div>
                  <StackDetailPendingRequests requests={pendingRequests} />
                </div>
              </section>
            ) : null}
          </div>

          {isOwner && detail.isActive && pendingRequests.length === 0 ? (
            <section className="rounded-[10px] border border-white/6 bg-white/2">
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Pending requests
                </p>
                <span className="oc-profile-meta text-[11px] text-zinc-500">None</span>
              </div>
            </section>
          ) : null}

          {isAcceptedMember && !isOwner && detail.isActive ? (
            <section className="rounded-[10px] border border-white/6 bg-white/2">
              <div className="px-4 py-4 sm:px-5 sm:py-4.5">
                <p className="oc-profile-meta mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Your actions
                </p>
                <RequestToJoinButton
                  initialState="accepted"
                  roleOptions={detail.post.lookingForRoles}
                  postId={detail.post.id}
                  tone="duos"
                  viewerState="authenticated"
                />
              </div>
            </section>
          ) : null}
        </PageReveal>
      </PageContainer>
    </main>
  );
}
