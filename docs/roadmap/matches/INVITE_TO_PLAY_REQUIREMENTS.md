Update the Invite to Play roadmap to include:

1. Notification dropdown in main menu
Purpose:
- Show incoming pending play invites
- Show invite badge count
- Let recipient accept/decline quickly
- Show loading/empty/error states
- Realtime updates when new invites arrive
- Remove/gray out expired invites
- Keep dropdown compact, not a full inbox

Dropdown items:
- Sender avatar/name
- Sender role/rank/region
- Related post title if available
- Optional message
- Time left / created time
- Accept button
- Decline button

2. Matches page
Purpose:
- Show accepted play connections
- Show current/recent matches
- Unlock Discord/BattleTag only for accepted invites
- Let users view who they matched with
- Separate pending notifications from accepted history

Matches page sections:
- Active/Recent Matches
- Pending Sent Invites
- Past Matches
- Empty state
- Expired/declined/cancelled history optional

3. Data requirements
- play_invites supports pending, accepted, declined, expired, cancelled
- accepted invites become “matches”
- either use play_invites as match history or create a separate matches table
- recommend best option and explain tradeoff
- add indexes/views needed for dropdown and matches page

4. UI requirements
- Main menu notification bell/dropdown
- Badge count for pending incoming invites
- Realtime subscription for incoming invites
- Matches nav link/page
- Button states on posts:
  Invite to Play
  Invite Sent
  Matched
  Unavailable
  Profile Required

5. Security/RLS
- only recipient can accept/decline
- only sender can cancel
- only participants can view accepted match/contact info
- contact info hidden until accepted
- expired invites cannot be accepted

Output:
Revise the roadmap into clear phases:
- DB/schema
- RPC/security
- notification dropdown
- matches page
- realtime behavior
- QA checklist

Keep it specific, scalable, and token efficient.