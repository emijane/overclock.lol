# Stacks QA Checklist

Use this as the canonical QA checklist for `/stacks`, `/stacks/create`, and
`/stacks/[postId]`.

## Release Bar

- `npm run typecheck`
- `npm run verify`
- relevant stack tests pass
- changed behavior is covered by the manual matrix below
- `[perf:stacks]` logs do not show a meaningful regression for the touched route

## Route Truth

Shipped stack routes:

- `/stacks`
- `/stacks/create`
- `/stacks/[postId]`

Do not treat `/teams` or `/scrims` as stack-adjacent shipped routes.

## Automated Coverage Targets

Focus automated tests on stack-only logic that is easy to isolate without full
browser E2E:

- stack detail viewer gating
  - owner detection
  - accepted-member detection
  - request-state fetch gating
  - pending-request fetch gating
  - member contact-info fetch gating
- stack inactive copy
  - active fallback
  - closed
  - expired
- stack card/detail normalization
  - `author.badges` remains an array when detail hydration skips badge loading
  - owner fallback member normalization stays stable
- stack role need derivation
  - open slots shrink as members are accepted
  - overfilled roles do not produce negative counts
- stack action rules
  - guest join flow redirects to login
  - duplicate active-stack errors map to the stack-specific copy
  - close return paths preserve stack detail/profile paths
- stack request normalizers
  - wrapped payloads
  - malformed payloads
  - unknown statuses

## Manual Matrix

### `/stacks`

- guest viewer
  - feed loads
  - no viewer-only request/member state leaks
  - create CTA points to login
- authenticated viewer without active stack
  - feed loads
  - current stack panel does not appear
  - create CTA remains available
- authenticated viewer with active stack
  - current stack panel appears
  - create flow is blocked with the expected copy
  - current stack links to the active stack post
- filters
  - mode
  - posting role
  - looking-for role
  - min/max rank
  - region
  - search normalization and canonical URL updates
- responsive
  - mobile card layout
  - desktop card layout
  - sidebar/filter behavior remains intact

### `/stacks/[postId]`

- guest viewer
  - public detail loads
  - request-to-join respects guest flow
  - owner/member contact data is absent
- authenticated non-member
  - request-to-join only shows for eligible active stacks
  - no owner-only controls appear
  - no member contact info appears
- authenticated accepted member
  - accepted member state renders
  - contact info is visible
  - owner-only controls remain hidden
- authenticated owner with no pending requests
  - close button appears
  - pending requests section shows `None`
  - contact info appears for current members
- authenticated owner with pending requests
  - pending requests section renders
  - accept/decline controls work
  - member count and membership state stay in sync after actions
- missing/hidden post
  - empty state renders
  - stack detail does not leak private data
- inactive post states
  - filled
  - closed
  - expired
- blocked-state behavior
  - blocked author is hidden from feed/detail where expected
  - blocked members do not leak in stack member surfaces

### Presence and Identity

- avatar fallback
- banner fallback
- presence dot respects privacy flags
- quick hard reload does not repeatedly fire `updateLastSeen` inside the write window
- global auth bar still renders correctly for signed-in users

## Security-Sensitive Checks

- guest `/stacks` does not receive viewer-only bundle data
- guest or unrelated viewers never see owner/member contact info
- owner-only actions still depend on server-side ownership checks
- accepted-member actions still depend on server-side membership checks
- stack request state cannot be spoofed by client-only URL or form changes

## Performance Regression Checks

Use `[perf:stacks]` logs as part of stack QA until the route is stable enough to
remove instrumentation.

Record and compare:

| Route | Label |
| --- | --- |
| `/stacks` | `getLFGFeedPageDto rpc` |
| `/stacks` | `LFGPageShell stacks total data load` |
| `/stacks/[postId]` | `StackDetailPage getCurrentUserId` |
| `/stacks/[postId]` | `getStackPostDetailById post query` |
| `/stacks/[postId]` | `getStackPostDetailById hydrate` |
| `/stacks/[postId]` | `StackDetailPage total data load` |

Current sample baseline from recent isolated traces:

| Route | Label | Sample |
| --- | --- | --- |
| `/stacks` | `getLFGFeedPageDto rpc` | `219ms` |
| `/stacks` | `LFGPageShell stacks total data load` | `231ms` |
| `/stacks/[postId]` | `StackDetailPage getCurrentUserId` | `2-3ms` |
| `/stacks/[postId]` | `getStackPostDetailById post query` | `208-317ms` typical isolated sample, with higher outliers observed |
| `/stacks/[postId]` | `getStackPostDetailById hydrate` | `106-143ms` after badge-skip optimization |
| `/stacks/[postId]` | `StackDetailPage total data load` | `321-478ms` typical isolated sample, with higher DB-driven outliers observed |
