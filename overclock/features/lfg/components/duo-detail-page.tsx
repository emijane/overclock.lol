import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { PageContainer } from "@/components/app-shell/page-container";
import { PageReveal } from "@/components/app-shell/page-reveal";
import { PresenceIndicator } from "@/components/presence/presence-indicator";
import { RankedAvatar } from "@/components/profile/ranked-avatar";
import { closeLFGPost } from "@/features/lfg/actions";
import { getBadgeAssetSrc, getBadgePreset } from "@/lib/badges/badge-assets";
import { COMPETITIVE_ROLE_LABELS } from "@/lib/competitive/competitive-role-labels";
import { getRankIconSrc } from "@/lib/competitive/rank-icons";
import { getLFGGameModeLabel } from "@/lib/lfg/lfg-post-types";
import { getSocialThreadHrefMapByPeerProfileId } from "@/lib/chat/chat-records";
import { getLFGPostInviteStates } from "@/lib/matches/play-invites";
import { getDuoPostDetailById } from "@/lib/lfg/posts/posts-queries";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import { getCurrentUserId } from "@/lib/profiles/get-current-profile";
import Image from "next/image";

import { CopyStackLinkButton } from "./copy-stack-link-button";
import { LFGInviteButton } from "@/components/matches/lfg-invite-button";

type DuoDetailPageProps = {
  postId: string;
};

function getRoleChipClassName(role: string) {
  if (role === "tank") return "border-sky-400/14 bg-sky-400/6 text-sky-100/80";
  if (role === "dps") return "border-rose-400/14 bg-rose-400/6 text-rose-100/80";
  return "border-emerald-400/14 bg-emerald-400/6 text-emerald-100/80";
}

export async function DuoDetailPage({ postId }: DuoDetailPageProps) {
  const currentProfileId = await getCurrentUserId();
  const detail = await getDuoPostDetailById(postId, currentProfileId);

  const atmosphereOverlays = (
    <>
      <div aria-hidden="true" className="oc-atmosphere-dots-primary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-dots-secondary pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-spotlight pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="oc-atmosphere-vignette pointer-events-none absolute inset-0" />
    </>
  );

  if (!detail) {
    return (
      <main className="oc-atmosphere-bg relative flex-1 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
        {atmosphereOverlays}
        <PageContainer className="relative z-10 flex flex-col gap-4" maxWidthClassName="max-w-[48rem]">
          <PageReveal className="flex flex-col gap-4">
            <Link
              href="/duos"
              className="oc-profile-meta inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-zinc-300"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
              Duos
            </Link>
            <section className="rounded-[10px] border border-white/6 bg-white/2 px-5 py-8 text-center sm:px-6">
              <h2 className="oc-profile-display text-[20px] font-semibold tracking-[-0.03em] text-zinc-50">
                We couldn&apos;t find that post
              </h2>
              <p className="oc-profile-meta mx-auto mt-2 max-w-xl text-[11px] leading-5 text-zinc-400">
                The post may have been removed, closed, or cleaned up after its retention window.
              </p>
              <div className="mt-5">
                <Link
                  href="/duos"
                  className="oc-profile-display inline-flex h-9 items-center rounded-[10px] border border-white/6 bg-white/3 px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-50"
                >
                  Back to Duos
                </Link>
              </div>
            </section>
          </PageReveal>
        </PageContainer>
      </main>
    );
  }

  const post = detail.post;
  const isOwner = Boolean(currentProfileId && post.profileId === currentProfileId);
  const viewerState = currentProfileId ? "authenticated" : ("guest" as const);

  const inviteStates =
    !isOwner && currentProfileId && post.profileId
      ? await getLFGPostInviteStates({
          currentProfileId,
          posts: [{ id: post.id, profileId: post.profileId }],
        })
      : null;

  const inviteState = inviteStates?.[post.id] ?? "invite_to_play";

  const messageHref =
    inviteState === "connected" && post.profileId
      ? ((await getSocialThreadHrefMapByPeerProfileId([post.profileId]))[post.profileId] ?? null)
      : null;

  const rankLabel = formatCurrentRank(post.rankTier, post.rankDivision);
  const rankIconSrc = getRankIconSrc(post.rankTier);
  const displayName = post.author.displayName ?? post.author.username ?? "Player";
  const visibleName = post.author.username ?? post.author.displayName ?? "Player";
  const profileHref = post.author.username ? `/u/${post.author.username}` : null;
  const postingRoleLabel = COMPETITIVE_ROLE_LABELS[post.postingRole] ?? post.postingRole;

  const statusLabel = !detail.isActive
    ? post.status === "closed"
      ? "Closed"
      : "Expired"
    : null;

  return (
    <main className="oc-atmosphere-bg relative flex-1 px-4 py-6 text-zinc-100 sm:px-6 sm:py-8">
      {atmosphereOverlays}

      <PageContainer className="relative z-10 flex flex-col gap-4" maxWidthClassName="max-w-[48rem]">
        <PageReveal className="flex flex-col gap-4">
          <Link
            href="/duos"
            className="oc-profile-meta inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-zinc-300"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
            Duos
          </Link>

          {!detail.isActive ? (
            <section className="rounded-[10px] border border-amber-500/20 bg-amber-500/5">
              <div className="px-5 py-4 sm:px-6 sm:py-4.5">
                <h2 className="oc-profile-display text-[18px] font-semibold tracking-[-0.03em] text-zinc-50">
                  This post is {statusLabel?.toLowerCase()}
                </h2>
                <p className="oc-profile-meta mt-2 max-w-2xl text-[11px] leading-5 text-zinc-300">
                  {post.status === "closed"
                    ? "This Duo post has been closed and is no longer accepting connections."
                    : "This Duo post has expired and is no longer visible in the feed."}
                </p>
                <div className="mt-4">
                  <Link
                    href="/duos"
                    className="oc-profile-display inline-flex h-9 items-center rounded-[10px] border border-white/6 bg-white/3 px-3.5 text-[13px] font-semibold text-zinc-200 transition hover:border-white/12 hover:bg-white/6 hover:text-zinc-50"
                  >
                    Back to Duos
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {/* Main post card */}
          <section className="rounded-[10px] border border-white/6 bg-white/2">
            {/* Cover + actions */}
            <div className="relative h-24 overflow-hidden rounded-t-[9px] border-b border-white/6 bg-zinc-950/95 sm:h-25">
              {post.author.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.coverImageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover brightness-[0.32] saturate-[0.5]"
                />
              ) : null}
              <div className="absolute right-4 top-3 z-10 flex items-center gap-2 sm:right-5">
                <CopyStackLinkButton path={`/duos/${post.id}`} />
                {isOwner && detail.isActive ? (
                  <form action={closeLFGPost}>
                    <input type="hidden" name="post_id" value={post.id} />
                    <input type="hidden" name="return_path" value={`/duos/${post.id}`} />
                    <button
                      type="submit"
                      className="oc-profile-display inline-flex h-7 items-center rounded-[10px] border border-rose-500/20 bg-black/55 px-2.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm transition hover:border-rose-500/30 hover:bg-black/70 hover:text-zinc-50"
                    >
                      Close post
                    </button>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="px-4 sm:px-5">
              {/* Avatar */}
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

              {/* Title */}
              <h1 className="oc-profile-display text-[22px] font-semibold leading-[1.1] tracking-[-0.04em] text-zinc-50 sm:text-[26px]">
                {post.title}
              </h1>

              {/* Meta row */}
              <div className="oc-profile-meta mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
                {profileHref ? (
                  <Link href={profileHref} className="font-medium text-zinc-300 transition hover:text-zinc-100">
                    {displayName}
                  </Link>
                ) : (
                  <span className="font-medium text-zinc-300">{displayName}</span>
                )}
                <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                <span>{getLFGGameModeLabel(post.gameMode)}</span>
                {post.region ? (
                  <>
                    <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                    <span>{post.region}</span>
                  </>
                ) : null}
                {post.timezone ? (
                  <>
                    <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                    <span>{post.timezone}</span>
                  </>
                ) : null}
                {post.platform ? (
                  <>
                    <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                    <span>{post.platform}</span>
                  </>
                ) : null}
              </div>

              {/* Rank + role */}
              <div className="oc-profile-meta mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium">
                {rankIconSrc ? (
                  <Image
                    src={rankIconSrc}
                    alt={`${rankLabel} rank icon`}
                    width={16}
                    height={16}
                    className="h-3.5 w-3.5 shrink-0 object-contain opacity-85"
                  />
                ) : null}
                <span className="text-zinc-300">{rankLabel}</span>
                <span aria-hidden="true" className="text-zinc-700">&bull;</span>
                <span>{postingRoleLabel}</span>
              </div>

              {/* Author badges */}
              {post.author.badges.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {post.author.badges.map((badge) => {
                    const preset = getBadgePreset(badge.slug);
                    const assetSrc = getBadgeAssetSrc(badge.slug, badge.icon);
                    return preset ? (
                      <span
                        key={badge.id}
                        className={`inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-0.5 text-[9px] ${preset.lfgClassName}`}
                      >
                        <preset.Icon className={`h-3 w-3 shrink-0 ${preset.iconClassName}`} />
                        {badge.label}
                      </span>
                    ) : assetSrc ? (
                      <span key={badge.id} title={badge.label} aria-label={badge.label} className="inline-flex h-4 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={assetSrc} alt={badge.label} className="h-4 w-auto object-contain opacity-90" />
                      </span>
                    ) : (
                      <span key={badge.id} className="inline-flex h-4 items-center rounded-[7px] border border-white/[0.08] bg-white/[0.03] px-1.5 text-[9px] font-medium uppercase tracking-[0.08em] text-zinc-400">
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
              ) : null}

              {/* Looking for */}
              {post.lookingForRoles.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="oc-profile-meta text-[10px] text-zinc-500">Looking for</span>
                  {post.lookingForRoles.map((role) => (
                    <span
                      key={role}
                      className={`oc-profile-pill border px-2 py-0.5 text-[10px] font-medium ${getRoleChipClassName(role)}`}
                    >
                      {COMPETITIVE_ROLE_LABELS[role] ?? role}
                    </span>
                  ))}
                </div>
              ) : null}

              {/* Hero pool */}
              {post.heroPool.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.heroPool.map((hero) => (
                    <div
                      key={hero.id}
                      title={hero.label}
                      aria-label={hero.label}
                      className="relative h-9 w-9 overflow-hidden rounded-[8px] border border-white/6 bg-zinc-900/80"
                    >
                      {hero.imageSrc ? (
                        <Image
                          src={hero.imageSrc}
                          alt={hero.label}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Action bar */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pb-4 sm:pb-5">
                {statusLabel ? (
                  <span className="oc-profile-pill border border-white/6 bg-white/3 px-2.5 py-0.5 text-[10px] text-zinc-400">
                    {statusLabel}
                  </span>
                ) : (
                  <span />
                )}
                {!isOwner && post.profileId && detail.isActive ? (
                  <LFGInviteButton
                    connectedHref={messageHref}
                    initialState={inviteState}
                    recipientProfileId={post.profileId}
                    sourceLFGPostId={post.id}
                    tone="duos"
                    viewerState={viewerState}
                  />
                ) : null}
              </div>
            </div>
          </section>
        </PageReveal>
      </PageContainer>
    </main>
  );
}
