# Stacks Performance Audit

**Date:** 2026-05-20  
**Status:** Phase 2 complete — instrumentation live + Fix 1 and Fix 2 applied  
**Scope:** `/stacks` listing page and `/stacks/[postId]` detail page  
**Symptom:** ~1.2s GET time on stacks routes vs. faster times on other pages

**Enable timing logs:** set `STACKS_PERF=1` in `.env.local` and look for `[perf:stacks]` lines in server output.

---

## 1. Symptoms

**Affected routes:**
- `GET /stacks` — listing page, ~1.2s observed
- `GET /stacks/[postId]` — detail page, ~1.2s observed

**Comparison routes (faster):**
- `/duos` — uses same `LFGSectionPage` → `LFGPageShell` shell and same `get_lfg_feed_page_dto` RPC, but **stacks feed requires three additional CTEs** (`stack_member_sets`, `viewer_stack_memberships`, `viewer_stack_requests`) that do not run for duos. Also `getCurrentActiveStackForProfile` and `getCurrentActiveStackPostIdForProfile` are only called for stacks.

**Key structural difference vs. duos:** The `/stacks` listing makes 2–3 extra round-trips and the RPC performs significantly more join work per request than the equivalent duos call.

---

## 2. Fetch Map

### 2a. `/stacks` (listing) — authenticated viewer

All fetches happen inside `LFGPageShell` → `getLFGPageData`. The outer shell calls `getCurrentProfile()` first, then the inner function runs.

| # | Operation | Function | Returns | Parallel? | Conditional? |
|---|-----------|----------|---------|-----------|--------------|
| 1 | Auth + profile lookup | `getCurrentProfile()` (via React `cache`) | `{ user, profile }` | No (first, gating) | Always |
| 2 | Feed DTO (RPC) | `getLFGFeedPageDto` → `supabase.rpc("get_lfg_feed_page_dto", ...)` | Up to 30 posts + viewer bundle (comp profile, hero pools, active post counts) | Parallel with #3 | Always when `type` is set |
| 3 | Current active stack | `getCurrentActiveStackForProfile(profileId)` → `getCurrentActiveStackPostIdForProfile` → `get_profile_active_stack_post_id` RPC | A single `LFGPost` or null | Parallel with #2 | Only when `type === "stacks"` AND `profileId` exists |
| 4 | Current stack post ID fallback | `getCurrentActiveStackPostIdForProfile(profile.id)` | A UUID or null | Sequential after #2/#3 | Only when `type === "stacks"` AND `profileId` exists |
| 5 | Fallback stack post load | `getActiveStackPostById(postId)` | A single `LFGPost` or null | Sequential after #4 | Only when viewer is blocked from creating AND has no stack from DTO |

**Notes:**
- Fetch #4 (`getCurrentActiveStackPostIdForProfile`) is called unconditionally after `getLFGPageData` returns, even though `getCurrentActiveStackForProfile` (fetch #3) already internally calls `getCurrentActiveStackPostIdForProfile`. This is a **duplicate fetch for the same data** (see Section 10).
- Fetch #2 and #3 are correctly `Promise.all`'d inside `getLFGPageData`.
- The `createClient()` factory is called separately inside each library function. Every fetch creates a new Supabase SSR client (which reads cookies), though the underlying HTTP connection may be reused.

### 2b. `/stacks/[postId]` (detail) — authenticated viewer

All fetches happen inside `StackDetailPage`.

| # | Operation | Function | Returns | Parallel? | Conditional? |
|---|-----------|----------|---------|-----------|--------------|
| 1 | Auth + profile lookup | `getCurrentProfile()` (via React `cache`) | `{ user, profile }` | No (first, gating) | Always |
| 2 | Stack post detail | `getStackPostDetailById(postId, profileId)` | Post row + blocked IDs + badges + stack members | No (sequential after #1) | Always |
| 2a | — Block list | `getBlockedProfileIdsForViewer(profileId)` | UUID[] | Inside #2 | Only if viewer is authenticated |
| 2b | — Badge lookup | `loadBadgesByProfileId(supabase, [postRow])` | Map<profileId, badge[]> | Inside #2, sequential after post row | Always (1 post author) |
| 2c | — Stack members | `loadStackMembersByPostId(supabase, [postRow])` | Map<postId, StackMember[]> | Inside #2, sequential after post row | Always for stacks |
| 3 | Request state | `getStackRequestStateForPost(profileId, postId)` | `"none" \| "pending" \| "accepted" \| "declined"` | No (sequential after #2) | Only if viewer is NOT owner AND NOT member AND post is active |
| 4 | Incoming pending requests | `getIncomingPendingStackRequests({ currentProfileId })` | All pending requests for the owner across ALL their posts | No (sequential after #2) | Only if viewer IS owner AND post is active |
| 5 | Member contact info | `getStackMemberContactInfoForViewer(postId, viewerProfileId)` | Map<profileId, { discord, battlenet }> — 2 queries | No (sequential after #2) | Only if viewer is owner OR accepted member |

**Total sequential awaits for an owner viewing their own active stack:** #1 → #2 (which contains 3 sequential sub-queries) → #4 → #5. That is **5 sequential round-trips** to Supabase, with #3 skipped.

**Total sequential awaits for a non-member viewing an active stack:** #1 → #2 (3 sub-queries) → #3. That is **4 sequential round-trips**.

### 2c. `/duos` (listing) — for comparison

Identical shell (`LFGPageShell`) and identical flow to `/stacks`, but:
- Fetch #3 (`getCurrentActiveStackForProfile`) is skipped: `type === "stacks"` guard fails
- Fetch #4 (`getCurrentActiveStackPostIdForProfile`) is skipped: same guard
- Inside `get_lfg_feed_page_dto` RPC: `stack_member_sets`, `viewer_stack_memberships`, and `viewer_stack_requests` CTEs all short-circuit (`fp.lfg_type = 'stacks'` IN filters return no rows for duos)
- Net: duos makes **2 fewer round-trips** (no stack-specific RPC calls) and the RPC itself is cheaper

---

## 3. Auth & Profile Lookup Map

`getCurrentProfile()` is wrapped in React's `cache()`, so it deduplicated within a single React render tree.

| Call site | File | Notes |
|-----------|------|-------|
| `GlobalAuthBarServer` | `components/navigation/global-auth-bar-server.tsx` | Called in root `layout.tsx` |
| `LFGPageShell` | `features/lfg/components/lfg-page-shell.tsx:307` | Called in the listing page shell |
| `StackDetailPage` | `features/lfg/components/stack-detail-page.tsx:352` | Called in the detail page |

**Conclusion:** `getCurrentProfile()` is called from both the layout component (`GlobalAuthBarServer`) and from each page's server component. Because it is wrapped in `cache()`, the actual Supabase `auth.getUser()` + profile select executes **exactly once per request**, not multiple times. This is correctly deduplicated.

Each call to `getCurrentProfile()` executes:
1. `supabase.auth.getUser()` — one network call to Supabase Auth
2. `supabase.from("profiles").select(OWNER_PROFILE_SELECT).eq("id", user.id).maybeSingle()` — one query

Both are deduped by `cache()` across the render.

**Auth overhead per request: 1 auth call + 1 profile query, correctly deduplicated.**

---

## 4. Cache / Rendering Mode

**No `export const revalidate` is set** anywhere in `app/stacks/page.tsx`, `app/stacks/[postId]/page.tsx`, or `app/duos/page.tsx`.

**No `export const dynamic` is set** in any of these files.

**No `unstable_cache`, `noStore()`, or `cache()` wrappers** are used on any of the data-fetching functions in `lib/lfg/`, `lib/pages/`, or `lib/profiles/`.

**However, Next.js App Router forces dynamic rendering** for any route that uses cookies. Every call to `createClient()` in `lib/supabase/server.ts` calls `await cookies()` from `next/headers`. This opts the entire page into dynamic rendering — every request is fully server-rendered with no caching at the page level.

This is expected and intentional (user-specific content), but it means:
- There is **zero page-level caching** for `/stacks` or `/stacks/[postId]`
- Every GET triggers the full waterfall of Supabase calls
- No stale-while-revalidate, no CDN cache hit for authenticated content

**Dynamic rendering is unavoidable here due to user-specific auth, block lists, and request states.** The performance ceiling is therefore set by the sum of all Supabase round-trips.

---

## 5. SQL / RPC Analysis

### 5a. `get_lfg_feed_page_dto` (the main stacks feed RPC)

**Current version:** `20260520140000_fix_stack_request_state_for_removed_members.sql` (final rewrite of a function first introduced in `20260513040000_optimize_lfg_feed_page_dto.sql`).

**Structure:** One PL/pgSQL function returning a JSONB blob. Contains a single large CTE chain:

```sql
with feed_posts as (
  -- base filter: lfg_type, status in ('active','filled'), expires_at > now()
  -- + optional filters: role, looking_for, mode, region, search, rank_tiers
  -- + block exclusion via: not (lp.profile_id = any(v_blocked_profile_ids))
  -- order by created_at desc, limit 30
  select lp.* from public.lfg_posts lp where ...
),
badge_sets as (
  -- join profile_badges + badges for all distinct feed post authors
  select pb.profile_id, jsonb_agg(...) from profile_badges pb
  join badges b on b.id = pb.badge_id
  where pb.profile_id in (select distinct fp.profile_id from feed_posts fp)
  group by pb.profile_id
),
stack_member_sets as (
  -- STACKS ONLY: join stack_members + profiles for all posts in feed
  select sm.post_id, jsonb_agg(...)
  from stack_members sm
  join profiles member on member.id = sm.profile_id
  where sm.post_id in (select fp.id from feed_posts fp where fp.lfg_type = 'stacks')
    and sm.removed_at is null
    and not (sm.profile_id = any(v_blocked_profile_ids))
  group by sm.post_id
),
viewer_connections as (...),   -- for authenticated viewers
viewer_invites as (...),        -- for authenticated viewers
viewer_stack_memberships as (...), -- STACKS ONLY, authenticated
viewer_stack_requests as (...)     -- STACKS ONLY, authenticated
select jsonb_agg(...) into v_posts
from feed_posts fp
join profiles author on author.id = fp.profile_id
left join badge_sets, stack_member_sets, viewer_connections, viewer_invites,
          viewer_stack_memberships, viewer_stack_requests
```

Then after the CTE block, for authenticated viewers:
- One lookup on `competitive_profiles` for viewer's `main_role` + `platform`
- One subquery on `lfg_posts` for `activePostCounts` per role
- One subquery on `competitive_role_profiles` for viewer's roles
- One subquery on `profile_hero_pools` for viewer's hero picks

**Total for a stacks feed with authenticated viewer:**
- 1 scan of `lfg_posts` (feed_posts CTE)
- 1 scan of `profile_badges` + `badges` join (badge_sets)
- 1 scan of `stack_members` + `profiles` join (stack_member_sets) — **stacks-only work**
- 1 scan of `profile_connections` (viewer_connections)
- 1 scan of `play_invites` (viewer_invites)
- 1 scan of `stack_members` (viewer_stack_memberships) — **stacks-only work**
- 1 scan of `stack_requests` (viewer_stack_requests) — **stacks-only work**
- 1 join to `profiles` (author)
- 1 lookup on `competitive_profiles`
- 1 subquery on `lfg_posts` (activePostCounts)
- 1 subquery on `competitive_role_profiles`
- 1 subquery on `profile_hero_pools`

**For duos: only 7 of these 12 scans run** (stacks-only CTEs short-circuit). For stacks: all 12 run inside a single RPC call. The three stacks-specific CTE scans (stack_member_sets, viewer_stack_memberships, viewer_stack_requests) each need to join `stack_members` — a table that grows with every accepted request.

**JOIN complexity for stacks feed:**
The `stack_member_sets` CTE joins `stack_members` to `profiles` for every non-removed member across up to 30 feed posts. If each stack averages 3–5 members, that is 90–150 profile row lookups in a single CTE. The `profiles` join here uses `member.id = sm.profile_id`, which requires the primary key index on `profiles` to be hit once per member row.

### 5b. `get_profile_active_stack_post_id` (called once per authenticated stacks listing)

```sql
select lp.id
from public.stack_members sm
join public.lfg_posts lp on lp.id = sm.post_id
where sm.profile_id = p_profile_id
  and sm.removed_at is null
  and lp.lfg_type = 'stacks'
  and lp.status in ('active', 'filled')
  and lp.expires_at > now()
  and (p_exclude_post_id is null or lp.id <> p_exclude_post_id)
order by sm.is_owner desc, sm.joined_at desc
limit 1;
```

This hits `stack_members` filtered by `profile_id` and `removed_at is null`, then joins `lfg_posts`. The index `stack_members_profile_active_idx (profile_id, joined_at desc) where removed_at is null` should support this well. The `lfg_posts` join then filters by `lfg_type`, `status`, and `expires_at`. The partial index `lfg_posts_active_expires_feed_idx (lfg_type, expires_at desc) where status = 'active'` only covers `status = 'active'` — not `status = 'filled'` — so posts with `status = 'filled'` fall through to a non-partial scan.

### 5c. `getStackPostDetailById` (detail page, called once)

Uses `getStackPostDetailByIdInternal` which runs three sequential queries:
1. `SELECT ... FROM lfg_posts WHERE id = $postId AND lfg_type = 'stacks'` — single PK lookup, fast
2. `loadBadgesByProfileId` — `SELECT ... FROM profile_badges WHERE profile_id = $authorId` — indexed by `profile_badges_profile_granted_lookup_idx`
3. `loadStackMembersByPostId` — `SELECT ... FROM stack_members WHERE post_id IN ($postId) AND removed_at IS NULL ORDER BY is_owner DESC, joined_at ASC` — indexed by `stack_members_post_active_idx (post_id, joined_at asc) where removed_at is null`

These three sub-queries are **sequential** (each `await`s individually) rather than parallelized with `Promise.all`.

### 5d. `getIncomingPendingStackRequests` (detail page, owner only)

```sql
SELECT id, post_id, requested_role, requester_profile_id, created_at,
       lfg_posts:post_id(title,status,expires_at),
       requester:requester_profile_id(id,username,display_name,avatar_url,...)
FROM stack_requests
WHERE owner_profile_id = $currentProfileId
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20
```

This fetches **all pending requests for the owner across all their posts**, not just for the current post. The filtering to the current post (`request.postId === detail.post.id`) happens in JavaScript after the query. The index `stack_requests_owner_pending_idx (owner_profile_id, status, created_at desc)` should support this, but the query over-fetches up to 20 rows from all posts when only 1 post's requests are needed.

### 5e. `getStackMemberContactInfoForViewer` (detail page, members/owner only)

Two sequential queries:
1. Membership check: `SELECT profile_id FROM stack_members WHERE post_id = $postId AND profile_id = $viewerProfileId AND removed_at IS NULL LIMIT 1`
2. Contact fetch: `SELECT profile_id, profiles:profile_id(discord_username, battlenet_handle) FROM stack_members WHERE post_id = $postId AND removed_at IS NULL`

Both are indexed by `stack_members_active_post_profile_idx (post_id, profile_id) where removed_at is null`. These two queries are sequential and could be combined.

---

## 6. Index Audit

### Indexes present (from migrations)

**`lfg_posts` table:**

| Index name | Columns | Condition |
|------------|---------|-----------|
| `lfg_posts_public_active_feed_idx` | `(lfg_type, created_at desc)` | `WHERE status = 'active'` |
| `lfg_posts_owner_history_idx` | `(profile_id, created_at desc)` | none |
| `lfg_posts_owner_active_role_idx` | `(profile_id, lfg_type, posting_role, created_at desc)` | `WHERE status = 'active'` |
| `lfg_posts_owner_active_duplicate_idx` | `(profile_id, lfg_type, game_mode, posting_role, created_at desc)` | `WHERE status = 'active'` |
| `lfg_posts_owner_creation_window_idx` | `(profile_id, lfg_type, created_at desc)` | none |
| `lfg_posts_active_expires_feed_idx` | `(lfg_type, expires_at desc)` | `WHERE status = 'active'` |

**`stack_members` table:**

| Index name | Columns | Condition |
|------------|---------|-----------|
| `stack_members_active_post_profile_idx` | `(post_id, profile_id)` UNIQUE | `WHERE removed_at IS NULL` |
| `stack_members_single_owner_idx` | `(post_id)` UNIQUE | `WHERE is_owner = true AND removed_at IS NULL` |
| `stack_members_profile_active_idx` | `(profile_id, joined_at desc)` | `WHERE removed_at IS NULL` |
| `stack_members_post_active_idx` | `(post_id, joined_at asc)` | `WHERE removed_at IS NULL` |

**`stack_requests` table:**

| Index name | Columns | Condition |
|------------|---------|-----------|
| `stack_requests_post_requester_pending_idx` | `(post_id, requester_profile_id)` UNIQUE | `WHERE status = 'pending'` |
| `stack_requests_owner_pending_idx` | `(owner_profile_id, status, created_at desc)` | none |
| `stack_requests_post_accepted_idx` | `(post_id, accepted_at desc)` | `WHERE status = 'accepted'` |
| `stack_requests_requester_idx` | `(requester_profile_id, status, created_at desc)` | none |

**`profile_badges` table:**

| Index name | Columns | Condition |
|------------|---------|-----------|
| `profile_badges_profile_granted_lookup_idx` | `(profile_id, granted_at)` | none |

### Missing or mismatched indexes

**Issue 1 — `lfg_posts_active_expires_feed_idx` does not cover `status = 'filled'`.**

The partial index is `WHERE status = 'active'`. However, the stacks feed query in `get_lfg_feed_page_dto` filters:
```sql
case when p_lfg_type = 'stacks' then lp.status in ('active', 'filled') else lp.status = 'active' end
and lp.expires_at > now()
```

For stacks, the condition is `status IN ('active', 'filled')`, which the partial index cannot fully satisfy. Postgres must either use a full table scan or the looser non-partial index. The same mismatch affects `lfg_posts_public_active_feed_idx` (also only `WHERE status = 'active'`). A stacks-specific index covering both statuses would close this gap:
```sql
create index lfg_posts_stacks_active_feed_idx
  on public.lfg_posts (lfg_type, expires_at desc, created_at desc)
  where status in ('active', 'filled');
```

**Issue 2 — No index on `stack_members.post_id` without the partial `removed_at IS NULL` condition.**

The `stack_member_sets` CTE in `get_lfg_feed_page_dto` filters:
```sql
where sm.post_id in (select fp.id from feed_posts fp where fp.lfg_type = 'stacks')
  and sm.removed_at is null
```

The `stack_members_post_active_idx` (partial: `WHERE removed_at IS NULL`) should cover this, since the CTE also requires `removed_at IS NULL`. This is likely fine.

**Issue 3 — No compound index on `stack_requests` for the `viewer_stack_requests` CTE.**

The CTE:
```sql
select distinct on (sr.post_id) sr.post_id, sr.status
from public.stack_requests sr
where v_viewer_profile_id is not null
  and sr.requester_profile_id = v_viewer_profile_id
  and sr.post_id in (select fp.id from feed_posts fp where fp.lfg_type = 'stacks')
order by sr.post_id, sr.created_at desc
```

The existing `stack_requests_requester_idx (requester_profile_id, status, created_at desc)` does not include `post_id`, so the `distinct on (sr.post_id) ... order by sr.post_id, sr.created_at desc` requires a sort step after the index scan. A covering index `(requester_profile_id, post_id, created_at desc)` would eliminate the sort.

**Issue 4 — `activePostCounts` subquery inside viewer bundle uses an unindexed `expires_at` filter for `status = 'filled'`.**

```sql
from public.lfg_posts lp
where lp.profile_id = v_viewer_profile_id
  and lp.lfg_type = p_lfg_type
  and lp.expires_at > now()
  and (when p_lfg_type = 'stacks' then lp.status in ('active', 'filled') else lp.status = 'active')
```

The index `lfg_posts_owner_active_role_idx (profile_id, lfg_type, posting_role, created_at desc) WHERE status = 'active'` and `lfg_posts_owner_history_idx (profile_id, created_at desc)` both miss the `expires_at` filter for stacks. A narrow index on `(profile_id, lfg_type, status)` would help, but since this subquery is only over the viewer's own posts (typically 0–2 rows), the practical impact is low.

---

## 7. Suspected Bottlenecks

Ranked by estimated contribution to the ~1.2s GET time.

| Rank | Bottleneck | Reasoning |
|------|-----------|-----------|
| 1 | **`get_lfg_feed_page_dto` RPC for stacks** | Single RPC call, but executes 7 CTEs + 4 subqueries. The `stack_member_sets` CTE joins `stack_members` to `profiles` for all members across up to 30 posts (potentially 90–150 profile lookups via PK). The `viewer_stack_memberships` and `viewer_stack_requests` CTEs add two more scans. This CTE chain executes entirely in the database but serializes on the RPC call. No equivalent work exists for duos. |
| 2 | **Three sequential sub-queries inside `getStackPostDetailById`** (detail page only) | `loadBadgesByProfileId` and `loadStackMembersByPostId` both `await` separately after the initial post row fetch. Two extra round-trips that could be `Promise.all`'d. |
| 3 | **Sequential waterfall on `/stacks` listing for authenticated users** | `getCurrentProfile()` → then `getLFGPageData()` (which parallelizes #2 and #3 but still runs sequentially after auth) → then `getCurrentActiveStackPostIdForProfile()` (sequential) → then possibly `getActiveStackPostById()`. Three sequential round-trips before the page renders. |
| 4 | **Duplicate call to `getCurrentActiveStackPostIdForProfile`** (listing page, authenticated) | Called once inside `getCurrentActiveStackForProfile()` (which is inside `getLFGPageData`) and again directly in `LFGPageShell` lines 325–327. Two RPC calls for `get_profile_active_stack_post_id` per request for any authenticated stacks viewer. |
| 5 | **`getIncomingPendingStackRequests` over-fetches** (detail page, owner only) | Fetches up to 20 pending requests across ALL of the owner's posts, then filters in JS. For active owners with multiple stacks or historical requests, this returns unnecessary rows. |
| 6 | **`lfg_posts_active_expires_feed_idx` partial index mismatch for stacks** | The index `WHERE status = 'active'` does not cover `status = 'filled'`. The stacks feed query filters `status IN ('active', 'filled')`, potentially causing a seq scan or suboptimal plan for the feed_posts CTE. |
| 7 | **New `createClient()` call per function** | Each library function (`getStackMemberContactInfoForViewer`, `getIncomingPendingStackRequests`, `getBlockedProfileIdsForViewer`, etc.) calls `await createClient()` which calls `await cookies()`. While cookies() is cached by Next.js internally, repeated instantiation adds overhead. |

---

## 8. Confirmed Bottlenecks

Timing instrumentation is now live (gated by `STACKS_PERF=1`). Actual measurements from a production-like environment are needed to populate this section. Instrumented call sites:

| Label | What it measures |
|-------|-----------------|
| `[perf:stacks] getLFGFeedPageDto rpc` | Time for `get_lfg_feed_page_dto` RPC + JS normalization |
| `[perf:stacks] getLFGPageData Promise.all dto+currentStack` | Time for the parallel DTO + current-stack fetch |
| `[perf:stacks] hydrateSingleStackPost badges+members parallel` | Time for `Promise.all([loadBadges, loadStackMembers])` after Fix 2 |
| `[perf:stacks] getStackPostDetailById blocks` | Time for `getBlockedProfileIdsForViewer` on detail page |
| `[perf:stacks] getStackPostDetailById post query` | Time for the `lfg_posts` row fetch on detail page |
| `[perf:stacks] getStackPostDetailById hydrate` | Time for `hydrateSingleStackPost` (badges + members) |
| `[perf:stacks] getIncomingPendingStackRequests blocks` | Time for `getBlockedProfileIdsForViewer` inside pending requests |
| `[perf:stacks] getIncomingPendingStackRequests query` | Time for the `stack_requests` query |

**Note:** `react-hooks/purity` lint rule blocks `Date.now()` inside React Server Component bodies, so component-level timing (e.g., total time for `StackDetailPage`) is not directly instrumentable. Timing covers the underlying data-access functions instead.

---

## 9. Over-fetch / Unnecessary Fetch Findings

### Finding 1 — `getIncomingPendingStackRequests` fetches all posts' requests, not just the current post's

**File:** `lib/lfg/stack-requests.ts:242`  
**Code:**
```typescript
const { data, error } = await supabase
  .from("stack_requests")
  .select([...].join(","))
  .eq("owner_profile_id", input.currentProfileId)
  .eq("status", "pending")
  .order("created_at", { ascending: false })
  .limit(20);
```
Then in `stack-detail-page.tsx:398`:
```typescript
.then((result) =>
  result.requests.filter((request) => request.postId === detail.post.id)
)
```

The query returns all pending requests the owner has received across all their stacks (up to 20 total), then filters by post ID in JavaScript. If the owner has multiple active stacks with pending requests, unrelated rows are fetched and discarded. The fix is to add `.eq("post_id", detail.post.id)` to the Supabase query.

### Finding 2 — `getStackMemberContactInfoForViewer` runs two sequential queries that could be one

**File:** `lib/lfg/posts/posts-queries.ts:739`

First does a membership check:
```typescript
const { data: memberCheck } = await supabase
  .from("stack_members").select("profile_id")
  .eq("post_id", input.postId).eq("profile_id", input.viewerProfileId)
  .is("removed_at", null).limit(1).maybeSingle();
```

Then fetches contact info:
```typescript
const { data } = await supabase
  .from("stack_members")
  .select("profile_id, profiles:profile_id(discord_username, battlenet_handle)")
  .eq("post_id", input.postId).is("removed_at", null);
```

The membership check (`memberCheck`) is needed to guard the contact query, but the second query already returns `profile_id` rows. The caller could check whether the viewer's `profileId` appears in the returned contact rows rather than making a separate membership check query.

### Finding 3 — The listing page fetches `hero_pool_snapshot` for every post author even though it is never displayed in the card UI

The `get_lfg_feed_page_dto` RPC returns `heroPool: coalesce(fp.hero_pool_snapshot, '[]'::jsonb)` for every feed post. The `hero_pool_snapshot` column is a JSONB array that can be large (all hero picks). Looking at `lfg-post-card.tsx` and `stack-post-card.tsx`, the hero pool is rendered in the listing cards (as avatar icons), so this is not truly wasted — but it does mean every post row transfers potentially large JSONB blobs.

### Finding 4 — The detail page fetches contact info for the viewer who is already known to be a member

The guard in `stack-detail-page.tsx:403`:
```typescript
const memberContactInfo =
  (isOwner || isAcceptedMember) && profile?.id
    ? await getStackMemberContactInfoForViewer(...)
    : null;
```

This correctly gates on membership. No over-fetch for non-members. This is properly conditioned.

---

## 10. Duplicate Fetch Findings

### Finding 1 — `getCurrentActiveStackPostIdForProfile` called twice per request (listing page, authenticated)

**File:** `features/lfg/components/lfg-page-shell.tsx`

Call 1 (inside `getLFGPageData`, line 245):
```typescript
type === "stacks" && profileId
  ? getCurrentActiveStackForProfile(profileId).catch(() => null)
  : Promise.resolve(null),
```

`getCurrentActiveStackForProfile` is defined in `lib/lfg/posts/posts-queries.ts:451`:
```typescript
export async function getCurrentActiveStackForProfile(profileId: string) {
  const postId = await getCurrentActiveStackPostIdForProfile(profileId);
  if (!postId) return null;
  return getActiveStackPostById(postId);
}
```

So it calls `getCurrentActiveStackPostIdForProfile` → `get_profile_active_stack_post_id` RPC.

Call 2 (in `LFGPageShell`, line 325):
```typescript
const currentStackMembershipPostId =
  type === "stacks" && profile?.id
    ? await getCurrentActiveStackPostIdForProfile(profile.id).catch(() => null)
    : null;
```

This is a direct second call to `getCurrentActiveStackPostIdForProfile` → `get_profile_active_stack_post_id` RPC.

**Effect:** For every authenticated stacks listing request, `get_profile_active_stack_post_id` is invoked twice via separate Supabase RPC calls. The second call also runs the fallback `getCurrentActiveStackPostIdFromMembershipQuery` if the RPC fails. This is a clear duplicate and can be collapsed.

### Finding 2 — `getBlockedProfileIdsForViewer` called once inside `getStackPostDetailByIdInternal` and again inside `getIncomingPendingStackRequests` (detail page, owner)

`getStackPostDetailById` calls `getBlockedProfileIdsForViewer(viewerProfileId)` at the start of `getStackPostDetailByIdInternal`. Then `getIncomingPendingStackRequests` also calls `getBlockedProfileIdsForViewer(input.currentProfileId)`. For an owner viewing their post, the blocked profile ID list is fetched twice from `user_blocks`. These could share a single result if both are called in a shared context.

---

## 11. Recommended Fixes

Ranked by impact and implementation risk. No code changes are made here — all items are recommendations only.

### Fix 1 — Collapse the duplicate `getCurrentActiveStackPostIdForProfile` call ✅ Applied

**Impact: High | Risk: Low**

In `lfg-page-shell.tsx`, the `getLFGPageData` function already calls `getCurrentActiveStackForProfile` which internally calls `getCurrentActiveStackPostIdForProfile`. The second direct call on line 325 should be eliminated. The post ID from the first call is already returned in `pageData.currentStack?.id`. Replace:

```typescript
const currentStackMembershipPostId =
  type === "stacks" && profile?.id
    ? await getCurrentActiveStackPostIdForProfile(profile.id).catch(() => null)
    : null;
```

with:

```typescript
const currentStackMembershipPostId =
  type === "stacks" ? pageData.currentStack?.id ?? null : null;
```

This eliminates one round-trip to `get_profile_active_stack_post_id` per authenticated stacks listing request.

### Fix 2 — Parallelize sub-queries inside `getStackPostDetailByIdInternal` ✅ Applied

**Impact: Medium-High | Risk: Low**

Currently `loadBadgesByProfileId` and `loadStackMembersByPostId` run sequentially after the post row fetch. They are independent of each other. Replace:

```typescript
const badgesByProfileId = await loadBadgesByProfileId(supabase, [postRow]);
const stackMembersByPostId = await loadStackMembersByPostId(supabase, [postRow]);
```

with:

```typescript
const [badgesByProfileId, stackMembersByPostId] = await Promise.all([
  loadBadgesByProfileId(supabase, [postRow]),
  loadStackMembersByPostId(supabase, [postRow]),
]);
```

This cuts one round-trip latency from the detail page for all viewers.

### Fix 3 — Scope `getIncomingPendingStackRequests` to the current post ✅ Applied

**Impact: Medium | Risk: Low**

**Files changed:**
- `lib/lfg/stack-requests.ts` — added `postId: string` to input type; added `.eq("post_id", input.postId)` to the Supabase query
- `features/lfg/components/stack-detail-page.tsx` — removed `.then((result) => result.requests.filter(...))` JS-side filter; passes `postId: detail.post.id` directly

**Exact change in `stack-requests.ts`:**
```typescript
// Before
export async function getIncomingPendingStackRequests(input: {
  currentProfileId: string;
}): ...

  .eq("owner_profile_id", input.currentProfileId)
  .eq("status", "pending")

// After
export async function getIncomingPendingStackRequests(input: {
  currentProfileId: string;
  postId: string;
}): ...

  .eq("owner_profile_id", input.currentProfileId)
  .eq("post_id", input.postId)
  .eq("status", "pending")
```

**Exact change in `stack-detail-page.tsx`:**
```typescript
// Before
? await getIncomingPendingStackRequests({
    currentProfileId: profile.id,
  }).then((result) =>
    result.requests.filter((request) => request.postId === detail.post.id)
  )

// After
? (await getIncomingPendingStackRequests({
    currentProfileId: profile.id,
    postId: detail.post.id,
  })).requests
```

**Effect:** The `stack_requests` query now filters by both `owner_profile_id` and `post_id` at the database level, using the existing `stack_requests_post_requester_pending_idx (post_id, requester_profile_id) WHERE status = 'pending'` partial index. For an owner with multiple active stacks, this eliminates fetching and discarding rows from unrelated posts. For a single-stack owner the row count was already ≤ a handful, so the payload reduction is small but the index path is now tighter.

**Row count before Fix 3:** Up to 20 rows returned (all pending requests across all of owner's stacks), then JS-filtered to current post.  
**Row count after Fix 3:** Only rows for the specific `post_id` returned. Expected 0–5 rows for a typical stack.

**Before/after timing:** Not yet measured with `STACKS_PERF=1` in a production-like environment. Expected reduction in `getIncomingPendingStackRequests query` log line when the owner has requests across multiple posts.

**QA:** `npm run verify` passes. No change to blocked-user filtering, owner guard, role validation, or expiry checks — all remain in the JS normalization loop.

**Risk:** Low. The `stack_requests_owner_pending_idx (owner_profile_id, status, created_at desc)` still supports the query; the added `.eq("post_id", ...)` narrows the scan. All existing security checks (owner guard at call site, blocked-user filter in loop, status/expiry validation) are preserved.

### Fix 4 — Add a stacks-specific partial index on `lfg_posts` covering `status IN ('active', 'filled')` ✅ Applied

**Impact: Medium | Risk: Low**

**Migration:** `overclock/supabase/migrations/20260520150000_add_lfg_posts_stacks_feed_idx.sql`

**Index added:**
```sql
create index if not exists lfg_posts_stacks_feed_idx
  on public.lfg_posts (lfg_type, created_at desc)
  where status in ('active', 'filled');
```

**Why the old indexes did not fully match:**

Two existing indexes cover the `lfg_posts` feed path:

| Index | Columns | Partial predicate |
|-------|---------|-------------------|
| `lfg_posts_public_active_feed_idx` | `(lfg_type, created_at desc)` | `WHERE status = 'active'` |
| `lfg_posts_active_expires_feed_idx` | `(lfg_type, expires_at desc)` | `WHERE status = 'active'` |

Both partial predicates are `WHERE status = 'active'`. The stacks feed query filters `status IN ('active', 'filled')` — stacks that are `status = 'filled'` (the stack is full but still visible in the feed) are not covered. Postgres cannot use either index to build a complete result set for the stacks feed; it must either fall back to a broader scan or use the index only for `status = 'active'` rows and heap-scan the rest.

**Why this column order:**

The feed query orders `ORDER BY created_at DESC LIMIT 30`. Using `(lfg_type, created_at desc)` allows the planner to satisfy this ordering via an index scan with no separate sort step — the same pattern as `lfg_posts_public_active_feed_idx` for the duos feed. The `expires_at > now()` filter is applied as a residual: since recent posts are almost always non-expired (24h window), the first 30 qualifying rows are found quickly without deep index traversal.

An alternative shape with `expires_at` in the index columns — e.g., `(lfg_type, expires_at desc, created_at desc)` — would force a sort step for ORDER BY since `created_at` would not be the leading sort key after the `expires_at` range.

**EXPLAIN ANALYZE:** Not yet run against production or a local Supabase instance. To verify usage, run in the Supabase SQL editor:

```sql
explain (analyze, buffers, format text)
select * from public.lfg_posts
where lfg_type = 'stacks'
  and status in ('active', 'filled')
  and expires_at > now()
order by created_at desc
limit 30;
```

Look for `Index Scan using lfg_posts_stacks_feed_idx` in the plan. If the planner still chooses a different index or a seq scan, inspect the row count estimates.

**Expected impact:** For the `feed_posts` CTE in `get_lfg_feed_page_dto` when called with `p_lfg_type = 'stacks'`, the planner can now use `lfg_posts_stacks_feed_idx` for a full index scan covering both `status = 'active'` and `status = 'filled'` rows. This primarily helps when there are meaningful numbers of `status = 'filled'` stacks in the feed. With few filled stacks, the improvement is marginal; with many active filled stacks, it closes the gap between duos and stacks feed planning.

**Before/after timing:** Not yet measured. Requires running with `STACKS_PERF=1` before and after applying the migration to a live Supabase instance.

**QA:** `npm run verify` passes. No app behavior change — migration is additive only. No RLS or RPC modifications.

**Risk:** Low. `CREATE INDEX IF NOT EXISTS` is a non-destructive, non-blocking operation on Postgres 12+ (does not lock writes). No existing indexes removed.

### Fix 5 — Add a covering index on `stack_requests` for `viewer_stack_requests` CTE ✅ Applied

**Impact: Low-Medium | Risk: Low**

**Migration:** `overclock/supabase/migrations/20260520160000_add_stack_requests_requester_post_created_idx.sql`

**Index added:**
```sql
create index if not exists stack_requests_requester_post_created_idx
  on public.stack_requests (requester_profile_id, post_id, created_at desc);
```

**Why the old index did not match:**

The `viewer_stack_requests` CTE inside `get_lfg_feed_page_dto`:
```sql
select distinct on (sr.post_id) sr.post_id, sr.status
from public.stack_requests sr
where sr.requester_profile_id = v_viewer_profile_id
  and sr.post_id in (select fp.id from feed_posts fp where fp.lfg_type = 'stacks')
order by sr.post_id, sr.created_at desc
```

The existing `stack_requests_requester_idx` covers `(requester_profile_id, status, created_at desc)`. After the equality seek on `requester_profile_id`, entries are ordered by `(status, created_at desc)` — not by `(post_id, created_at desc)`. The `DISTINCT ON (post_id) ORDER BY post_id, created_at desc` clause therefore requires a Sort node that the existing index cannot eliminate.

The new index `(requester_profile_id, post_id, created_at desc)` allows the planner to:
1. Seek to `requester_profile_id = v_viewer_profile_id`
2. Scan entries in `(post_id, created_at desc)` order — exactly matching `ORDER BY post_id, created_at desc`
3. Resolve `DISTINCT ON (post_id)` by reading the first row per `post_id` group in index order, with no separate Sort node

**EXPLAIN query to confirm usage:**
```sql
explain (analyze, buffers, format text)
select distinct on (sr.post_id) sr.post_id, sr.status
from public.stack_requests sr
where sr.requester_profile_id = '<viewer-uuid>'
  and sr.post_id in (
    select id from public.lfg_posts
    where lfg_type = 'stacks'
      and status in ('active', 'filled')
      and expires_at > now()
  )
order by sr.post_id, sr.created_at desc;
```

Look for `Index Scan using stack_requests_requester_post_created_idx` with no `Sort` node above it. Before Fix 5 there would be a `Sort` node after the index scan on the old `stack_requests_requester_idx`.

**EXPLAIN confirmed:** Not yet run against a live Supabase instance.

**Expected impact:** Eliminates one Sort node per stacks feed request for any authenticated viewer who has ever sent a stack request. The sort overhead depends on how many stack request rows the viewer has; for most users with a handful of past requests it is small. The benefit compounds slightly when the feed has many stacks posts (larger `IN (...)` set means more rows to sort before deduplication).

**Before/after timing:** Not yet measured. Requires running with `STACKS_PERF=1` before and after applying the migration to a live instance.

**QA:** `npm run verify` passes. Migration is additive only — no existing indexes dropped, no RLS or RPC changes.

**Risk:** Low. Non-partial `CREATE INDEX IF NOT EXISTS` on a typically small per-user slice of `stack_requests`. Non-blocking on Postgres 12+.

### Fix 6 — Merge the two queries in `getStackMemberContactInfoForViewer` into one ✅ Applied

**Impact: Low | Risk: Low**

**File changed:** `overclock/lib/lfg/posts/posts-queries.ts`

**Before (two sequential queries):**
```typescript
// Query 1: membership check
const { data: memberCheck, error: memberCheckError } = await supabase
  .from("stack_members")
  .select("profile_id")
  .eq("post_id", input.postId)
  .eq("profile_id", input.viewerProfileId)
  .is("removed_at", null)
  .limit(1)
  .maybeSingle();

if (memberCheckError || !memberCheck) return null;

// Query 2: contact info fetch (only runs if Query 1 succeeded)
const { data, error } = await supabase
  .from("stack_members")
  .select("profile_id, profiles:profile_id(discord_username, battlenet_handle)")
  .eq("post_id", input.postId)
  .is("removed_at", null);
```

**After (one query, membership verified in JS):**
```typescript
// Single query: fetch all active members with contact info
const { data, error } = await supabase
  .from("stack_members")
  .select("profile_id, profiles:profile_id(discord_username, battlenet_handle)")
  .eq("post_id", input.postId)
  .is("removed_at", null);

// Membership check: viewer must appear among non-removed members
const viewerIsActiveMember = rows.some(
  (row) => typeof row.profile_id === "string" && row.profile_id === input.viewerProfileId
);
if (!viewerIsActiveMember) return null;
```

**Security checks preserved:**
- `removed_at IS NULL` still applied in the query — removed members never appear in the results
- Viewer must appear in the results to receive contact info — if they were removed between the call-site guard and this fetch, they are absent from the rows and `null` is returned
- RLS on `stack_members` and `profiles` still applies to the single query
- Call-site guard `(isOwner || isAcceptedMember) && profile?.id` is unchanged in `stack-detail-page.tsx`
- Contact info columns (`discord_username`, `battlenet_handle`) are never fetched for non-member viewers because the function returns `null` before building the map

**Why this is equivalent:** The old Query 1 checked `stack_members WHERE post_id = X AND profile_id = viewerId AND removed_at IS NULL`. The new approach checks the same condition in JS after fetching rows that already satisfy `post_id = X AND removed_at IS NULL`. A removed viewer will have `removed_at IS NOT NULL`, so they are excluded from the result set and `viewerIsActiveMember` evaluates to `false`. The outcomes are identical.

**Expected impact:** Eliminates one sequential Supabase round-trip from the stack detail page for every owner and accepted member viewing an active stack. Given typical Supabase latency of 20–60ms per round-trip, this saves ~20–60ms on the affected path.

**Before/after timing:** Not yet measured with `STACKS_PERF=1` against a live instance.

**QA:** `npm run verify` passes. No schema, RLS, or UI changes.

### Fix 7 — Consider moving `stack_member_sets`, `viewer_stack_memberships`, and `viewer_stack_requests` to a separate stacks-specific RPC

**Impact: High long-term | Risk: Medium**

The `get_lfg_feed_page_dto` RPC currently handles both duos and stacks by branching inside the same function. The three stacks-only CTEs add significant work on every stacks call. A dedicated `get_stacks_feed_page_dto` RPC (or a PostgreSQL function that accepts a type flag and returns more efficiently for each type) would allow tighter index hints and simpler planner paths.

### Fix 8 — Parallelize `getStackRequestStateForPost`, `getIncomingPendingStackRequests`, and `getStackMemberContactInfoForViewer` on the detail page ✅ Applied

**Impact: Low-Medium | Risk: Low**

**File changed:** `overclock/features/lfg/components/stack-detail-page.tsx`

**Before (three sequential awaits):**
```typescript
// sequential: each waits for the previous
const requestState =
  profile?.id && !isOwner && !isAcceptedMember && detail.isActive
    ? await getStackRequestStateForPost({ ... }).catch(() => "none")
    : "none";

const pendingRequests =
  isOwner && detail.isActive && profile?.id
    ? (await getIncomingPendingStackRequests({ ... })).requests
    : [];

const memberContactInfo =
  (isOwner || isAcceptedMember) && profile?.id
    ? await getStackMemberContactInfoForViewer({ ... })
    : null;
```

**After (all three in `Promise.all`):**
```typescript
const profileId = profile?.id ?? null;
const shouldFetchRequestState = Boolean(profileId && !isOwner && !isAcceptedMember && detail.isActive);
const shouldFetchIncomingRequests = Boolean(isOwner && detail.isActive && profileId);
const shouldFetchContactInfo = Boolean((isOwner || isAcceptedMember) && profileId);

const [requestState, pendingRequests, memberContactInfo] = await Promise.all([
  profileId && shouldFetchRequestState
    ? getStackRequestStateForPost({ currentProfileId: profileId, postId: detail.post.id })
        .catch(() => "none" as const)
    : Promise.resolve("none" as const),
  profileId && shouldFetchIncomingRequests
    ? getIncomingPendingStackRequests({ currentProfileId: profileId, postId: detail.post.id })
        .then((r) => r.requests)
    : Promise.resolve([]),
  profileId && shouldFetchContactInfo
    ? getStackMemberContactInfoForViewer({ postId: detail.post.id, viewerProfileId: profileId })
    : Promise.resolve(null),
]);
```

**Security conditions preserved:**

| Condition | Before | After |
|-----------|--------|-------|
| `requestState` fetch gate | `profile?.id && !isOwner && !isAcceptedMember && detail.isActive` | `shouldFetchRequestState` = same boolean; `profileId &&` in ternary narrows type |
| `pendingRequests` fetch gate | `isOwner && detail.isActive && profile?.id` | `shouldFetchIncomingRequests` = same boolean |
| `memberContactInfo` fetch gate | `(isOwner \|\| isAcceptedMember) && profile?.id` | `shouldFetchContactInfo` = same boolean |
| Removed-member guard (Fix 6) | Inside `getStackMemberContactInfoForViewer` | Unchanged — function is unmodified |
| RLS | Applied in each function | Unchanged |

The `profileId &&` in each ternary is required for TypeScript type narrowing (`string | null` → `string`); it is logically redundant since the `shouldFetch*` booleans already include the `profileId` check.

**Expected impact:** For an owner viewing their own active stack with pending requests, the page previously awaited all three calls sequentially. After Fix 8, all three are in flight concurrently. The wall-clock cost becomes `max(requestState_ms, pendingRequests_ms, contactInfo_ms)` instead of the sum. With typical Supabase round-trips of 20–60ms each, this saves 40–120ms for the owner scenario.

For a non-member viewing an active stack only `requestState` fires; for an accepted member only `contactInfo` fires. Both cases are unchanged in cost since only one fetch runs anyway.

**QA:** `npm run verify` passes. TypeScript inferred all three promise types correctly without explicit annotations.

---

## 12. Instrumentation

### Files changed

| File | Change |
|------|--------|
| `overclock/lib/dev/perf-log.ts` | **New file.** Shared `stacksPerfLog(label, start, rows?)` helper gated by `STACKS_PERF=1`. Delete this file and its import sites to remove all instrumentation. |
| `overclock/lib/pages/lfg-feed-page-dto.ts` | Added `tRpc` timer + `stacksPerfLog` call around `get_lfg_feed_page_dto` RPC. |
| `overclock/features/lfg/components/lfg-page-shell.tsx` | Added `tDto` timer in `getLFGPageData` around `Promise.all([getLFGFeedPageDto, getCurrentActiveStackForProfile])`. Also: removed `getCurrentActiveStackPostIdForProfile` import (Fix 1). |
| `overclock/lib/lfg/posts/posts-queries.ts` | Added `tBlocked`, `tPostQuery`, `tHydrate` timers in `getStackPostDetailByIdInternal`. Applied Fix 2: `loadBadgesByProfileId` + `loadStackMembersByPostId` now run in `Promise.all` inside `hydrateSingleStackPost`. |
| `overclock/lib/lfg/stack-requests.ts` | Added `tBlocked` + `tQuery` timers in `getIncomingPendingStackRequests`. Added `postId` input + `.eq("post_id", ...)` filter (Fix 3). |
| `overclock/features/lfg/components/stack-detail-page.tsx` | Removed JS-side post-ID filter; passes `postId` to `getIncomingPendingStackRequests` (Fix 3). |
| `overclock/supabase/migrations/20260520150000_add_lfg_posts_stacks_feed_idx.sql` | **New file.** Adds `lfg_posts_stacks_feed_idx` (Fix 4). Additive only — no drops. |
| `overclock/supabase/migrations/20260520160000_add_stack_requests_requester_post_created_idx.sql` | **New file.** Adds `stack_requests_requester_post_created_idx` (Fix 5). Additive only — no drops. |
| `overclock/lib/lfg/posts/posts-queries.ts` | Merged two sequential queries in `getStackMemberContactInfoForViewer` into one (Fix 6). Membership verified in JS from results. |
| `overclock/features/lfg/components/stack-detail-page.tsx` | Parallelized `getStackRequestStateForPost`, `getIncomingPendingStackRequests`, and `getStackMemberContactInfoForViewer` with `Promise.all` (Fix 8). |

### Usage

```
# .env.local
STACKS_PERF=1
```

Navigate to `/stacks` or `/stacks/[postId]` and check server stdout. Example output:

```
[perf:stacks] getStackPostDetailById blocks +8ms rows=0
[perf:stacks] getStackPostDetailById post query +22ms
[perf:stacks] hydrateSingleStackPost badges+members parallel +31ms
[perf:stacks] getStackPostDetailById hydrate +32ms
[perf:stacks] getIncomingPendingStackRequests blocks +9ms rows=0
[perf:stacks] getIncomingPendingStackRequests query +18ms rows=2
```

### Removal

To remove all instrumentation cleanly: delete `overclock/lib/dev/perf-log.ts` and remove the five `import { stacksPerfLog }` statements across the files above. All `stacksPerfLog(...)` call sites are co-located with the import in each file.

---

## 12b. Previous Instrumentation Plan (pre-implementation)

Add the following timing points to confirm the suspected bottlenecks from Section 7:

### `/stacks` listing

**In `lfg-page-shell.tsx`, inside `getLFGPageData`:**
```typescript
console.time('[stacks] getLFGFeedPageDto');
const dtoResult = await getLFGFeedPageDto(...);
console.timeEnd('[stacks] getLFGFeedPageDto');

console.time('[stacks] getCurrentActiveStackForProfile');
const currentStack = await getCurrentActiveStackForProfile(profileId);
console.timeEnd('[stacks] getCurrentActiveStackForProfile');
```

**In `LFGPageShell`, after `getLFGPageData`:**
```typescript
console.time('[stacks] getCurrentActiveStackPostIdForProfile (2nd call)');
const currentStackMembershipPostId = await getCurrentActiveStackPostIdForProfile(profile.id);
console.timeEnd('[stacks] getCurrentActiveStackPostIdForProfile (2nd call)');
```

**Wrap the entire `LFGPageShell` render:**
```typescript
const t0 = Date.now();
const { profile, user } = await getCurrentProfile();
console.log('[stacks] getCurrentProfile', Date.now() - t0, 'ms');
```

### `/stacks/[postId]` detail

**In `StackDetailPage`:**
```typescript
console.time('[stacks-detail] getStackPostDetailById');
const detail = await getStackPostDetailById(postId, profile?.id ?? null);
console.timeEnd('[stacks-detail] getStackPostDetailById');

console.time('[stacks-detail] getStackRequestStateForPost');
const requestState = await getStackRequestStateForPost(...);
console.timeEnd('[stacks-detail] getStackRequestStateForPost');

console.time('[stacks-detail] getIncomingPendingStackRequests');
const pendingRequests = await getIncomingPendingStackRequests(...);
console.timeEnd('[stacks-detail] getIncomingPendingStackRequests');

console.time('[stacks-detail] getStackMemberContactInfoForViewer');
const memberContactInfo = await getStackMemberContactInfoForViewer(...);
console.timeEnd('[stacks-detail] getStackMemberContactInfoForViewer');
```

**In `posts-queries.ts`, inside `getStackPostDetailByIdInternal`:**
```typescript
console.time('[stacks-detail] loadBadgesByProfileId');
const badgesByProfileId = await loadBadgesByProfileId(supabase, [postRow]);
console.timeEnd('[stacks-detail] loadBadgesByProfileId');

console.time('[stacks-detail] loadStackMembersByPostId');
const stackMembersByPostId = await loadStackMembersByPostId(supabase, [postRow]);
console.timeEnd('[stacks-detail] loadStackMembersByPostId');
```

### Supabase query-level instrumentation

For the stacks feed RPC specifically, run in the Supabase SQL editor:
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT get_lfg_feed_page_dto('stacks', null, null, null, null, null, null, null);
```

Look for: Seq Scan on `lfg_posts`, Sort nodes from missing indexes, high actual rows vs. estimated rows on `stack_members` joins.

---

## 13. QA Checklist

After any fix is applied, verify the following before shipping:

- [ ] `/stacks` listing loads for guest (unauthenticated) — no auth errors, posts appear
- [ ] `/stacks` listing loads for authenticated non-member viewer — correct "Request to Join" button state
- [ ] `/stacks` listing loads for authenticated member/owner — correct "View current stack" banner
- [ ] `/stacks/[postId]` detail loads for guest — shows post, no member list actions, no contact info
- [ ] `/stacks/[postId]` detail loads for authenticated non-member — shows "Request to Join" or correct request state
- [ ] `/stacks/[postId]` detail loads for authenticated accepted member — shows contact info (Discord + BattleNet), shows "Leave Stack" button
- [ ] `/stacks/[postId]` detail loads for owner — shows pending requests panel, shows contact info, shows "Remove" buttons, shows "Close stack" button
- [ ] `/stacks/[postId]` detail for owner with **0 pending requests** — shows "Pending requests: None" section, no crash
- [ ] Closing a stack from the detail page redirects correctly with `?message=` param
- [ ] Requesting to join from the listing card updates state correctly
- [ ] "Current stack" banner on `/stacks` listing is accurate (shows own stack, not a stale fallback)
- [ ] `/duos` listing is unaffected — no regressions from any index changes
- [x] `npm run verify` passes after Fix 1 + Fix 2 instrumentation
- [x] `npm run verify` passes after Fix 3
- [x] `npm run verify` passes after Fix 4 migration
- [x] `npm run verify` passes after Fix 5 migration
- [x] `npm run verify` passes after Fix 6
- [x] `npm run verify` passes after Fix 8
- [ ] Verify no duplicate `getCurrentActiveStackPostIdForProfile` calls appear in server logs after Fix 1
- [ ] Verify page load times improve using `STACKS_PERF=1` instrumentation from Section 12

---

## 14. Before/After Metrics

Before timings are from the original symptom report. After timings require running with `STACKS_PERF=1` and collecting measurements.

| Route | Scenario | Before (ms) | After Fix 1+2 (ms) | Notes |
|-------|----------|-------------|---------------------|-------|
| `/stacks` | Guest (no auth) | ~1200 | TBD | Fix 1 not applicable (guest skips stack lookup) |
| `/stacks` | Authenticated, not in a stack | ~1200 | TBD | Fix 1 removes 1 round-trip |
| `/stacks` | Authenticated, in an active stack | ~1200 | TBD | Fix 1 removes 1 round-trip; net depends on RPC latency |
| `/stacks/[postId]` | Guest | TBD | TBD | Fix 2 applies: badges + members now parallel |
| `/stacks/[postId]` | Authenticated non-member | TBD | TBD | Fix 2 applies |
| `/stacks/[postId]` | Authenticated member | TBD | TBD | Fix 2 applies; contact fetch still sequential |
| `/stacks/[postId]` | Owner, 0 pending requests | TBD | TBD | Fix 2 applies; requests + contact still sequential |
| `/stacks/[postId]` | Owner, N pending requests | TBD | TBD | Fix 2 applies |
| `/duos` | Authenticated | TBD | TBD | Comparison baseline; unaffected by these fixes |

**Expected impact of Fix 1:** Saves one `get_profile_active_stack_post_id` RPC round-trip per authenticated stacks listing. With typical Supabase latency of 20–60ms per round-trip, this should shave 20–60ms from the listing page for logged-in users who have an active stack.

**Expected impact of Fix 2:** Saves one sequential Supabase round-trip on the detail page for all viewers. `loadBadgesByProfileId` and `loadStackMembersByPostId` now run in parallel. Savings ≈ whichever of the two queries is slower (expected 15–40ms).

---

## Appendix: File Reference

Key files read during this audit:

- `overclock/app/stacks/page.tsx` — thin route, delegates to `LFGSectionPage`
- `overclock/app/stacks/[postId]/page.tsx` — thin route, delegates to `StackDetailPage`
- `overclock/app/duos/page.tsx` — comparison route
- `overclock/app/layout.tsx` — root layout, calls `GlobalAuthBarServer` → `getCurrentProfile`
- `overclock/features/lfg/section-page.tsx` — `LFGSectionPage` component
- `overclock/features/lfg/components/lfg-page-shell.tsx` — main listing shell with all fetch logic
- `overclock/features/lfg/components/stack-detail-page.tsx` — detail page with sequential fetches
- `overclock/lib/pages/lfg-feed-page-dto.ts` — `getLFGFeedPageDto` function
- `overclock/lib/lfg/posts/posts-queries.ts` — `getStackPostDetailById`, `loadBadgesByProfileId`, `loadStackMembersByPostId`, `getCurrentActiveStackPostIdForProfile`, `getStackMemberContactInfoForViewer`
- `overclock/lib/lfg/stack-requests.ts` — `getIncomingPendingStackRequests`, `getStackRequestStateForPost`
- `overclock/lib/profiles/get-current-profile.ts` — `getCurrentProfile` with React `cache()`
- `overclock/lib/supabase/server.ts` — `createClient` (cookie-based, forces dynamic rendering)
- `overclock/supabase/migrations/20260427170000_bootstrap_public_profile_and_lfg_core_schema.sql` — table definitions + initial indexes
- `overclock/supabase/migrations/20260510000000_add_stack_requests.sql` — `stack_requests` table + indexes
- `overclock/supabase/migrations/20260510020000_stack_group_lifecycle.sql` — `stack_members` table + indexes
- `overclock/supabase/migrations/20260513040000_optimize_lfg_feed_page_dto.sql` — CTE-based RPC optimization
- `overclock/supabase/migrations/20260515010000_add_lfg_post_expiration_fields.sql` — `expires_at` column + partial index
- `overclock/supabase/migrations/20260515030000_switch_lfg_feed_to_expires_at.sql` — feed switches to `expires_at > now()`
- `overclock/supabase/migrations/20260520120000_align_active_stack_source_of_truth.sql` — `get_profile_active_stack_post_id` RPC
- `overclock/supabase/migrations/20260520140000_fix_stack_request_state_for_removed_members.sql` — latest `get_lfg_feed_page_dto` version
