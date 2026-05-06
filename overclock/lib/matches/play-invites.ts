import { createClient } from "@/lib/supabase/server";

type SendPlayInviteResult = {
  created: boolean;
  errorCode: string | null;
  inviteId: string | null;
};

function normalizeSendPlayInviteResult(value: unknown): SendPlayInviteResult {
  if (typeof value === "string") {
    try {
      return normalizeSendPlayInviteResult(JSON.parse(value));
    } catch {
      return {
        created: false,
        errorCode: "invalid_response",
        inviteId: null,
      };
    }
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? normalizeSendPlayInviteResult(value[0])
      : {
          created: false,
          errorCode: "invalid_response",
          inviteId: null,
        };
  }

  if (!value || typeof value !== "object") {
    return {
      created: false,
      errorCode: "invalid_response",
      inviteId: null,
    };
  }

  const candidate = value as Record<string, unknown>;
  const nestedCandidate =
    candidate.send_play_invite &&
    typeof candidate.send_play_invite === "object" &&
    !Array.isArray(candidate.send_play_invite)
      ? (candidate.send_play_invite as Record<string, unknown>)
      : candidate;

  return {
    created: nestedCandidate.created === true,
    errorCode:
      typeof nestedCandidate.error_code === "string"
        ? nestedCandidate.error_code
        : null,
    inviteId:
      typeof nestedCandidate.invite_id === "string"
        ? nestedCandidate.invite_id
        : null,
  };
}

export async function sendPlayInviteRecord(input: {
  message?: string | null;
  recipientProfileId: string;
  sourceLFGPostId?: string | null;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_play_invite", {
    p_message: input.message ?? null,
    p_recipient_profile_id: input.recipientProfileId,
    p_source_lfg_post_id: input.sourceLFGPostId ?? null,
  });

  if (error) {
    throw error;
  }

  return normalizeSendPlayInviteResult(data);
}
