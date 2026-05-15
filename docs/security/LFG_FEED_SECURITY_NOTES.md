# LFG Feed Security Notes

## Purpose

This document keeps a small set of current operational notes about LFG feed
protections that were previously only captured in app-local security notes.

## Current Feed Protections

- Duo and stack feed search sanitizes input before applying filters.
- Search strips control characters and noisy wildcard or special characters:
  `%`, `_`, `*`, `<`, `>`, `[`, `]`, `{`, `}`, `|`, `` ` ``, and `\`.
- Search whitespace is normalized before use.
- Search requires a minimum of `2` characters.
- Search is capped at `80` characters.
- Search is capped at `6` words.
- Canonical URL redirects normalize sanitized search params before feed render.

## Current Rate Limiting

- `GET /duos` and `GET /stacks` are rate-limited in `overclock/proxy.ts`.
- Limit is `45` requests per minute per `IP + pathname` bucket.
- Exceeded requests return HTTP `429`.
- The limiter implementation lives in
  `overclock/lib/lfg/lfg-feed-rate-limit.ts`.

## Platform Source Of Truth

- `competitive_profiles.platform` is the intended source of truth.
- `profiles.platform` was removed from app-layer reads before the DB column was
  dropped.
- LFG post creation uses `competitive_profiles.platform`.
- LFG cards display the saved `snapshot_platform` value from the post snapshot.

## Important Limitations

- The current feed rate limiter is in-memory only.
- It does not coordinate across multiple server instances.
- It resets on process restart or redeploy.
- It is a lightweight spam-reduction layer, not full DDoS protection.

## Follow-Up Options

- Add edge or CDN-based rate limiting.
- Add IP- or session-based persistent rate limiting via Redis or similar.
- Review DB indexing and query cost for feed search and filter combinations.
- Add observability around `429` counts and suspicious feed traffic.

## Related Docs

- `README.md`
- `SECURITY_BASELINE_AUDIT.md`
- `SECURITY_REMEDIATION_PASS_1.md`
