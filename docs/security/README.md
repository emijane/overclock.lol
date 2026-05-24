# Security Docs

This folder documents security-relevant platform behavior that is implemented in
the app today.

## Current Topics

- `SESSIONS_AND_PROFILES.md`
  - how Discord OAuth becomes a Supabase session
  - how the app maps one authenticated user to one app profile
  - which identity fields are trusted from auth metadata vs. user-edited in app
- `SECURITY_BASELINE_AUDIT.md`
  - current baseline security review and RPC inventory
- `SECURITY_REMEDIATION_PASS_1.md`
  - shipped remediation pass tied to the baseline audit
- `LFG_FEED_SECURITY_NOTES.md`
  - current operational notes for LFG feed protections and limits
- `LFG_EXPIRATION_ARCHITECTURE.md`
  - safe execution model for LFG expiration and retention cleanup
- `STACKS_SECURITY_HARDENING_2026-05-24.md`
  - stack-specific hardening notes for viewer context, block helpers, and contact visibility
