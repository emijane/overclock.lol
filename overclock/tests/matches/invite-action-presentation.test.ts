import test from "node:test";
import assert from "node:assert/strict";

import { getInviteActionPresentation } from "../../lib/matches/invite-action-presentation";

test("guest viewers get a login CTA", () => {
  const result = getInviteActionPresentation({
    inviteState: "invite_to_play",
    isPending: false,
    viewerState: "guest",
  });

  assert.deepEqual(result, {
    canSendInvite: false,
    href: "/login?type=error&message=Sign%20in%20to%20send%20play%20invites.",
    label: "Sign in to invite",
  });
});

test("signed-in viewers without a profile get onboarding CTA", () => {
  const result = getInviteActionPresentation({
    inviteState: "invite_to_play",
    isPending: false,
    viewerState: "profile_required",
  });

  assert.deepEqual(result, {
    canSendInvite: false,
    href: "/onboarding",
    label: "Profile Required",
  });
});

test("eligible viewers can send a fresh invite", () => {
  const result = getInviteActionPresentation({
    inviteState: "invite_to_play",
    isPending: false,
    viewerState: "signed_in",
  });

  assert.deepEqual(result, {
    canSendInvite: true,
    href: null,
    label: "Invite to Play",
  });
});

test("pending transitions disable the action and swap the label", () => {
  const result = getInviteActionPresentation({
    inviteState: "invite_to_play",
    isPending: true,
    viewerState: "signed_in",
  });

  assert.deepEqual(result, {
    canSendInvite: false,
    href: null,
    label: "Sending...",
  });
});

test("invite sent state is disabled", () => {
  const result = getInviteActionPresentation({
    inviteState: "invite_sent",
    isPending: false,
    viewerState: "signed_in",
  });

  assert.deepEqual(result, {
    canSendInvite: false,
    href: null,
    label: "Invite Sent",
  });
});

test("connected state is disabled", () => {
  const result = getInviteActionPresentation({
    inviteState: "connected",
    isPending: false,
    viewerState: "signed_in",
  });

  assert.deepEqual(result, {
    canSendInvite: false,
    href: null,
    label: "Connected",
  });
});

test("callers can override the idle label for LFG cards", () => {
  const result = getInviteActionPresentation({
    inviteState: "invite_to_play",
    isPending: false,
    labels: {
      idle: "Invite to play",
    },
    viewerState: "signed_in",
  });

  assert.deepEqual(result, {
    canSendInvite: true,
    href: null,
    label: "Invite to play",
  });
});
