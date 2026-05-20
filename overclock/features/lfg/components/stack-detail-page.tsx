import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { AuthMessage } from "@/components/auth/auth-message";
import { closeLFGPost } from "@/features/lfg/actions";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import {
  getStackPostDetailById,
  type StackPostDetail,
} from "@/lib/lfg/posts/posts-queries";
import {
  getIncomingPendingStackRequests,
  getStackRequestStateForPost,
} from "@/lib/lfg/stack-requests";
import { getCurrentProfile } from "@/lib/profiles/get-current-profile";

import { RemoveStackMemberButton } from "./remove-stack-member-button";
import { StackDetailPendingRequests } from "./stack-detail-pending-requests";
import { StackPostCard } from "./stack-post-card";

type StackDetailPageProps = {
  message?: string;
  messageType?: string;
  postId: string;
};

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
          className="oc-profile-display inline-flex h-9 items-center rounded-full border border-white/6 bg-white/3 px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-50"
        >
          Back to Stacks
        </Link>
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
    <section className="rounded-[10px] border border-white/6 bg-white/2">
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
                      {member.isOwner ? " · owner" : ""}
                    </p>
                  </div>
                </div>

                {canManageMembers && !member.isOwner ? (
                  <RemoveStackMemberButton
                    className="oc-profile-meta inline-flex h-8 items-center rounded-full border border-white/6 bg-white/3 px-3 text-[11px] font-medium text-zinc-400 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="oc-profile-display inline-flex h-9 items-center rounded-full border border-white/6 bg-white/3 px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-50"
                  >
                    Back to Stacks
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          <StackPostCard
            currentProfileId={profile?.id ?? null}
            post={detail.post}
            requestState={requestState}
            returnPath={`/stacks/${detail.post.id}`}
            showActions={false}
            showMembershipAction={detail.isActive}
            tone="duos"
          />

          <div className={isOwner && detail.isActive ? "grid gap-4 xl:grid-cols-2" : ""}>
            <MemberList currentProfileId={profile?.id ?? null} detail={detail} />

            {isOwner && detail.isActive ? (
              <section className="rounded-[10px] border border-white/6 bg-white/2">
                <div className="px-4 py-4 sm:px-5 sm:py-4.5">
                  <div className="mb-4 flex items-center gap-2">
                    <p className="oc-profile-meta text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Pending requests
                    </p>
                    {pendingRequests.length > 0 ? (
                      <span className="oc-profile-pill border border-white/6 bg-white/3 px-2 py-0.5 text-[10px] text-zinc-300">
                        {pendingRequests.length}
                      </span>
                    ) : null}
                  </div>
                  <StackDetailPendingRequests requests={pendingRequests} />
                </div>
              </section>
            ) : null}
          </div>

          {isOwner && detail.isActive ? (
            <div>
              <form action={closeLFGPost}>
                <input type="hidden" name="post_id" value={detail.post.id} />
                <input type="hidden" name="return_path" value={`/stacks/${detail.post.id}`} />
                <button
                  type="submit"
                  className="oc-profile-display inline-flex h-9 items-center rounded-full border border-white/6 bg-white/3 px-3.5 text-[13px] font-semibold text-zinc-400 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-200"
                >
                  Close stack
                </button>
              </form>
            </div>
          ) : null}
        </PageReveal>
      </PageContainer>
    </main>
  );
}
