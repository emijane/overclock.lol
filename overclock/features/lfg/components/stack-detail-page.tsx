import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { AuthMessage } from "@/components/auth/auth-message";
import { closeLFGPost } from "@/features/lfg/actions";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getLFGGameModeLabel, type LFGPost } from "@/lib/lfg/lfg-post-types";
import {
  getStackPostDetailById,
  type StackPostDetail,
} from "@/lib/lfg/posts/posts-queries";
import {
  getIncomingPendingStackRequests,
  getStackRequestStateForPost,
} from "@/lib/lfg/stack-requests";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

import { RequestToJoinButton } from "./request-to-join-button";
import { RemoveStackMemberButton } from "./remove-stack-member-button";
import { StackDetailPendingRequests } from "./stack-detail-pending-requests";
import { StackMemberAvatarStrip } from "./stack-member-avatar-strip";
import { StackPostCard } from "./stack-post-card";

type StackDetailPageProps = {
  message?: string;
  messageType?: string;
  postId: string;
};

type ViewerRelationship = "accepted_member" | "guest" | "non_member" | "owner" | "pending_requester";

function getRelationshipLabel(relationship: ViewerRelationship) {
  if (relationship === "owner") {
    return "Owner";
  }

  if (relationship === "accepted_member") {
    return "Accepted member";
  }

  if (relationship === "pending_requester") {
    return "Pending request";
  }

  if (relationship === "guest") {
    return "Signed out";
  }

  return "Non-member";
}

function getOwner(post: LFGPost) {
  return post.stackMembers.find((member) => member.isOwner) ?? null;
}

function getFallbackOwnerLabel(post: LFGPost) {
  return post.author.displayName ?? post.author.username ?? "Player";
}

function getInactiveStateCopy(detail: StackPostDetail) {
  if (detail.post.status === "closed") {
    return {
      description:
        "This stack has been closed, so join and management actions are no longer available.",
      title: "This stack is closed",
    };
  }

  if (detail.post.status === "expired" || detail.isExpired) {
    return {
      description:
        "This stack has expired and is no longer visible as an active listing in the feed.",
      title: "This stack has expired",
    };
  }

  return {
    description: "This stack is no longer available for active membership actions.",
    title: "This stack is not active",
  };
}

function EmptyDetailState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-5 py-8 text-center sm:px-6">
      <h2 className="oc-profile-display text-[20px] font-semibold tracking-[-0.03em] text-zinc-50">
        {title}
      </h2>
      <p className="oc-profile-meta mx-auto mt-2 max-w-xl text-[11px] leading-5 text-zinc-400">
        {description}
      </p>
      <div className="mt-5">
        <Link
          href="/stacks"
          className="oc-profile-display inline-flex h-9 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-50"
        >
          Back to Stacks
        </Link>
      </div>
    </section>
  );
}

function ActionSummary({
  detail,
  relationship,
  currentProfileId,
}: {
  currentProfileId: string | null;
  detail: StackPostDetail;
  relationship: ViewerRelationship;
}) {
  const owner = getOwner(detail.post);
  const ownerLabel = owner?.displayName ?? owner?.username ?? getFallbackOwnerLabel(detail.post);
  const ownerHref = owner?.username
    ? `/u/${owner.username}`
    : detail.post.author.username
      ? `/u/${detail.post.author.username}`
      : null;
  const openSpots = Math.max(
    (detail.post.maxGroupSize ?? detail.post.currentMemberCount) - detail.post.currentMemberCount,
    0
  );
  const isFull =
    detail.post.currentMemberCount >= (detail.post.maxGroupSize ?? 5) ||
    detail.post.status === "filled";

  return (
    <section className="rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
      <div className="px-4 py-4 sm:px-5 sm:py-4.5">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Stack relationship
              </span>
              <span className="oc-profile-pill border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-300">
                {getRelationshipLabel(relationship)}
              </span>
            </div>
            <h2 className="oc-profile-display text-[18px] font-semibold tracking-[-0.03em] text-zinc-50">
              {detail.post.title}
            </h2>
            <p className="oc-profile-meta text-[11px] leading-5 text-zinc-400">
              {detail.isActive
                ? "This page keeps the stack visible even if feed filters or search would hide its card."
                : getInactiveStateCopy(detail).description}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-[10px] border border-white/[0.05] bg-black/12 px-3.5 py-3">
              <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Owner
              </p>
              <div className="mt-2">
                {ownerHref ? (
                  <Link
                    href={ownerHref}
                    className="oc-profile-display text-[14px] font-semibold text-zinc-100 transition hover:text-white"
                  >
                    {ownerLabel}
                  </Link>
                ) : (
                  <p className="oc-profile-display text-[14px] font-semibold text-zinc-100">
                    {ownerLabel}
                  </p>
                )}
              </div>
              <div className="mt-3">
                <StackMemberAvatarStrip
                  currentMemberCount={detail.post.currentMemberCount}
                  currentProfileId={currentProfileId}
                  maxGroupSize={detail.post.maxGroupSize}
                  members={detail.post.stackMembers}
                  postId={detail.isActive ? detail.post.id : undefined}
                  tone="duos"
                />
              </div>
            </div>
            <div className="rounded-[10px] border border-white/[0.05] bg-black/12 px-3.5 py-3">
              <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Status
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="oc-profile-pill border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-300">
                  {getLFGGameModeLabel(detail.post.gameMode)}
                </span>
                <span className="oc-profile-pill border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-300">
                  {detail.post.currentMemberCount}/{detail.post.maxGroupSize ?? detail.post.currentMemberCount}
                </span>
                <span className="oc-profile-pill border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-300">
                  {detail.isActive
                    ? detail.post.status === "filled"
                      ? "Filled"
                      : "Active"
                    : detail.post.status === "closed"
                      ? "Closed"
                      : "Expired"}
                </span>
              </div>
              <p className="oc-profile-meta mt-2 text-[11px] text-zinc-400">
                {openSpots > 0
                  ? `${openSpots} open spot${openSpots === 1 ? "" : "s"} available`
                  : isFull
                    ? "No open spots available"
                    : "No open spots available"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {relationship === "owner" && detail.isActive ? (
              <form action={closeLFGPost}>
                <input type="hidden" name="post_id" value={detail.post.id} />
                <input type="hidden" name="return_path" value={`/stacks/${detail.post.id}`} />
                <button
                  type="submit"
                  className="oc-profile-display inline-flex h-9 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-50"
                >
                  Close stack
                </button>
              </form>
            ) : null}

            {relationship === "accepted_member" && detail.isActive ? (
              <RequestToJoinButton
                guestNextHref={`/stacks/${detail.post.id}`}
                initialState="accepted"
                lookingForRoles={detail.post.lookingForRoles}
                postId={detail.post.id}
                tone="duos"
                viewerState="authenticated"
              />
            ) : null}

            {(relationship === "guest" || relationship === "non_member" || relationship === "pending_requester") &&
            detail.isActive &&
            (!isFull || relationship === "pending_requester") ? (
              <RequestToJoinButton
                guestNextHref={`/stacks/${detail.post.id}`}
                initialState={relationship === "pending_requester" ? "pending" : "none"}
                lookingForRoles={detail.post.lookingForRoles}
                postId={detail.post.id}
                tone="duos"
                viewerState={currentProfileId ? "authenticated" : "guest"}
              />
            ) : null}

            {(relationship === "guest" || relationship === "non_member") &&
            detail.isActive &&
            isFull ? (
              <span className="oc-profile-meta inline-flex h-9 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 text-[11px] font-medium text-zinc-500">
                Stack full
              </span>
            ) : null}
          </div>

          {relationship === "guest" ? (
            <p className="oc-profile-meta text-[11px] leading-5 text-zinc-400">
              Sign in to request a spot or manage stack membership.
            </p>
          ) : relationship !== "owner" ? (
            <p className="oc-profile-meta text-[11px] leading-5 text-zinc-400">
              Only the stack owner can manage members and incoming requests.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function MemberList({
  currentProfileId,
  detail,
}: {
  currentProfileId: string | null;
  detail: StackPostDetail;
}) {
  const ownerProfileId =
    detail.post.stackMembers.find((member) => member.isOwner)?.profileId ?? null;
  const canManageMembers = Boolean(
    detail.isActive && ownerProfileId && currentProfileId && ownerProfileId === currentProfileId
  );
  const openSpots = Math.max(
    (detail.post.maxGroupSize ?? detail.post.currentMemberCount) - detail.post.currentMemberCount,
    0
  );

  return (
    <section className="rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
      <div className="px-4 py-4 sm:px-5 sm:py-4.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Current members
            </p>
            <h2 className="oc-profile-display mt-1 text-[18px] font-semibold tracking-[-0.03em] text-zinc-50">
              {detail.post.currentMemberCount}/{detail.post.maxGroupSize ?? detail.post.currentMemberCount}
            </h2>
          </div>
          <p className="oc-profile-meta text-[11px] text-zinc-400">
            {openSpots > 0
              ? `${openSpots} open spot${openSpots === 1 ? "" : "s"}`
              : "No open spots"}
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {detail.post.stackMembers.map((member) => {
            const memberLabel = member.displayName ?? member.username ?? "Player";
            const memberHref = member.username ? `/u/${member.username}` : null;
            const roleLabel = COMPETITIVE_ROLE_LABELS[member.role];

            return (
              <div
                key={member.profileId}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-white/[0.05] bg-black/12 px-4 py-3"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-zinc-900">
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
                      {member.isOwner ? " - owner" : ""}
                    </p>
                  </div>
                </div>

                {canManageMembers && !member.isOwner ? (
                  <RemoveStackMemberButton
                    className="oc-profile-meta inline-flex h-8 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-medium text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
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
  const { profile } = await getCurrentProfile();
  const detail = await getStackPostDetailById(postId, profile?.id ?? null);

  if (!detail) {
    return (
      <main className="oc-atmosphere-bg relative flex-1 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
        <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />
        <AuthMessage message={message} type={messageType} variant="toast" />
        <PageContainer className="relative z-10 flex flex-col gap-4" maxWidthClassName="max-w-[98rem]">
          <PageReveal className="space-y-4">
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

  const isOwner = Boolean(profile?.id && detail.post.profileId === profile.id);
  const isAcceptedMember = Boolean(
    profile?.id &&
      detail.post.stackMembers.some((member) => member.profileId === profile.id)
  );
  const requestState =
    profile?.id && !isOwner && !isAcceptedMember && detail.isActive
      ? await getStackRequestStateForPost({
          currentProfileId: profile.id,
          postId: detail.post.id,
        }).catch(() => "none" as const)
      : "none";
  const relationship: ViewerRelationship = !profile?.id
    ? "guest"
    : isOwner
      ? "owner"
      : isAcceptedMember
        ? "accepted_member"
        : requestState === "pending"
          ? "pending_requester"
          : "non_member";
  const pendingRequests =
    isOwner && detail.isActive && profile?.id
      ? await getIncomingPendingStackRequests({
          currentProfileId: profile.id,
        }).then((result) =>
          result.requests.filter((request) => request.postId === detail.post.id)
        )
      : [];

  return (
    <main className="oc-atmosphere-bg relative flex-1 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />
      <AuthMessage message={message} type={messageType} variant="toast" />

      <PageContainer className="relative z-10 flex flex-col gap-4" maxWidthClassName="max-w-[98rem]">
        <PageReveal className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Link
                href="/stacks"
                className="oc-profile-meta inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-zinc-300"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
                Stacks
              </Link>
              <div>
                <h1 className="oc-profile-display text-[34px] font-bold leading-[0.98] tracking-[-0.045em] text-zinc-50 sm:text-[40px]">
                  Stack Detail
                </h1>
                <p className="oc-profile-meta mt-2 max-w-xl text-[11px] leading-5 text-zinc-400">
                  A dedicated stack page for viewing members, request state, and the actions this stack currently supports.
                </p>
              </div>
            </div>
            {!detail.isActive ? (
              <span className="oc-profile-pill inline-flex self-start rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1 text-[11px] font-medium text-amber-100/80">
                {getInactiveStateCopy(detail).title}
              </span>
            ) : null}
          </div>
        </PageReveal>

        {!detail.isActive ? (
          <PageReveal>
            <section className="rounded-[10px] border border-amber-500/20 bg-amber-500/[0.05]">
              <div className="px-5 py-4 sm:px-6 sm:py-4.5">
                <h2 className="oc-profile-display text-[18px] font-semibold tracking-[-0.03em] text-zinc-50">
                  {getInactiveStateCopy(detail).title}
                </h2>
                <p className="oc-profile-meta mt-2 max-w-2xl text-[11px] leading-5 text-zinc-300">
                  {getInactiveStateCopy(detail).description}
                </p>
                <div className="mt-4">
                  <Link
                    href="/stacks"
                    className="oc-profile-display inline-flex h-9 items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-zinc-50"
                  >
                    Back to Stacks
                  </Link>
                </div>
              </div>
            </section>
          </PageReveal>
        ) : null}

        <PageReveal className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(21rem,0.85fr)]">
          <div className="min-w-0">
            <StackPostCard
              currentProfileId={profile?.id ?? null}
              post={detail.post}
              requestState={requestState}
              returnPath={`/stacks/${detail.post.id}`}
              showActions={false}
              showMembershipAction={false}
              tone="duos"
            />
          </div>
          <ActionSummary
            currentProfileId={profile?.id ?? null}
            detail={detail}
            relationship={relationship}
          />
        </PageReveal>

        <PageReveal className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <MemberList currentProfileId={profile?.id ?? null} detail={detail} />

          {isOwner ? (
            <section className="rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
              <div className="px-4 py-4 sm:px-5 sm:py-4.5">
                <div className="mb-4">
                  <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Pending requests
                  </p>
                  <h2 className="oc-profile-display mt-1 text-[18px] font-semibold tracking-[-0.03em] text-zinc-50">
                    {pendingRequests.length} pending
                  </h2>
                </div>
                <StackDetailPendingRequests requests={pendingRequests} />
              </div>
            </section>
          ) : (
            <section className="rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
              <div className="px-4 py-4 sm:px-5 sm:py-4.5">
                <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Stack access
                </p>
                <h2 className="oc-profile-display mt-1 text-[18px] font-semibold tracking-[-0.03em] text-zinc-50">
                  Viewer permissions
                </h2>
                <p className="oc-profile-meta mt-2 text-[11px] leading-5 text-zinc-400">
                  Request management, member removal, and closing the stack are owner-only actions.
                </p>
              </div>
            </section>
          )}
        </PageReveal>
      </PageContainer>
    </main>
  );
}
