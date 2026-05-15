You are auditing and fixing Overclock’s Supabase LFG database security.

Goal:
Make `lfg_posts` protections source-controlled, reviewable, and enforced at the database layer.

Focus only on:
- `lfg_posts`
- related Supabase migrations
- RLS policies
- RPC posting flow
- indexes/constraints needed for security and anti-abuse

Do not make unrelated UI changes.

## Required work

1. Inspect the current repo
Find:
- existing Supabase migrations
- `lfg_posts` schema
- current RLS policies if represented in code
- current RPC functions
- app code that inserts/updates `lfg_posts`

2. Identify gaps
Specifically check whether the repo contains source-controlled SQL for:
- `alter table public.lfg_posts enable row level security`
- public/select policy for feed reads
- authenticated insert ownership policy
- owner-only update policy
- delete restrictions or soft-delete model
- supporting indexes
- `create_lfg_post_atomic(...)`

3. Add missing migrations
Create Supabase migration files that define the missing database security rules.

At minimum, migrations should include:
- RLS enabled for `lfg_posts`
- public read policy for intended active feed rows
- authenticated users can only insert rows where `profile_id = auth.uid()`
- authenticated users can only update their own rows
- no unsafe delete policy unless explicitly justified
- supporting indexes for owner/section/rate-limit checks

4. Preserve RPC-based creation
Post creation should go through `create_lfg_post_atomic(...)`.

Make sure direct table access cannot bypass the intended business rules.

If direct inserts are still allowed by policy, explain the risk and recommend whether to move toward RPC-only inserts.

5. Validate anti-abuse assumptions
Verify database rules support:
- 2 active posts per role per section
- 4 creations per section per rolling 60 minutes
- closed/removed/expired posts still count toward creation history
- closing/removing frees active slot but not creation history

6. Add regression verification
Add tests, scripts, or documented SQL checks for:
- anonymous users cannot insert/update/delete
- users cannot create posts for another `profile_id`
- users cannot close/update another user’s post
- public feed reads still work as intended
- raw table access cannot bypass RPC protections if RPC-only is adopted

## Important constraints

- Do not rely only on frontend validation.
- Do not hard-delete posts if it erases abuse history.
- Do not weaken existing policies.
- Do not expose private fields unnecessarily in public reads.
- Do not change unrelated tables unless required.
- Do not apply migrations automatically unless I approve.
- Show me the SQL before telling me to run it.

## Deliverable

Return:
1. Files inspected
2. Security gaps found
3. Migration files created/updated
4. Exact SQL added
5. Any risks before applying
6. Manual test steps after migration
7. Report findings in LFG_SECURITY_AUDIT_REPORT.md
# Audit Prompt

This file is an audit instruction/prompt, not a source of truth for current
shipped product behavior.
