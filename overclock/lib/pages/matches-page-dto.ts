import type {
  ActiveProfileConnection,
  IncomingPendingPlayInvite,
  MatchParticipant,
  PendingSentPlayInvite,
} from "@/lib/matches/play-invites";
import { getActiveProfileConnections } from "@/lib/matches/play-invites";
import type { IncomingPendingStackRequest } from "@/lib/lfg/stack-request-types";
import { getSocialThreadHrefMapByPeerProfileId } from "@/lib/chat/chat-records";
import {
  matchesPerfLog,
  notificationsPerfLog,
  stacksPerfStart,
} from "@/lib/dev/perf-log";
import { formatCurrentRank } from "@/lib/profiles/profile-editor";
import { createClient } from "@/lib/supabase/server";

type ParticipantRecord = {
  avatarUrl: string | null;
  battlenetHandle: string | null;
  discordUsername: string | null;
  displayName: string | null;
  mainRole: string | null;
  profileId: string;
  rankDivision: number | null;
  rankLabel: string;
  rankTier: string | null;
  region: string | null;
  username: string | null;
};

export type MatchesPageDto = {
  connections: ActiveProfileConnection[];
  incomingInvites: IncomingPendingPlayInvite[];
  outgoingInvites: PendingSentPlayInvite[];
};

export type NotificationsMenuDto = {
  acceptedConnections: AcceptedConnectionNotification[];
  incomingInvites: IncomingPendingPlayInvite[];
  stackRequests: IncomingPendingStackRequest[];
  totalCount: number;
};

export type AcceptedConnectionNotification = {
  connectedAt: string;
  id: string;
  participant: MatchParticipant;
  sourcePostTitle: string | null;
  threadHref: string | null;
};

const ACCEPTED_CONNECTION_NOTIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

function normalizeParticipant(value: unknown): MatchParticipant | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.profileId !== "string") {
    return null;
  }

  const record: ParticipantRecord = {
    profileId: candidate.profileId,
    avatarUrl: typeof candidate.avatarUrl === "string" ? candidate.avatarUrl : null,
    battlenetHandle:
      typeof candidate.battlenetHandle === "string" ? candidate.battlenetHandle : null,
    discordUsername:
      typeof candidate.discordUsername === "string" ? candidate.discordUsername : null,
    displayName:
      typeof candidate.displayName === "string" ? candidate.displayName : null,
    mainRole: typeof candidate.mainRole === "string" ? candidate.mainRole : null,
    rankDivision:
      typeof candidate.rankDivision === "number" ? candidate.rankDivision : null,
    rankLabel: typeof candidate.rankLabel === "string" ? candidate.rankLabel : "",
    rankTier: typeof candidate.rankTier === "string" ? candidate.rankTier : null,
    region: typeof candidate.region === "string" ? candidate.region : null,
    username: typeof candidate.username === "string" ? candidate.username : null,
  };

  return {
    ...record,
    rankLabel:
      record.rankLabel || formatCurrentRank(record.rankTier, record.rankDivision),
  };
}

function normalizePendingInviteArray(
  value: unknown
): Array<IncomingPendingPlayInvite | PendingSentPlayInvite> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const candidate = entry as Record<string, unknown>;
      const participant = normalizeParticipant(candidate.participant);

      if (
        typeof candidate.id !== "string" ||
        typeof candidate.createdAt !== "string" ||
        typeof candidate.expiresAt !== "string" ||
        !participant
      ) {
        return null;
      }

      return {
        id: candidate.id,
        createdAt: candidate.createdAt,
        expiresAt: candidate.expiresAt,
        message: typeof candidate.message === "string" ? candidate.message : null,
        participant,
        sourcePostTitle:
          typeof candidate.sourcePostTitle === "string"
            ? candidate.sourcePostTitle
            : null,
      } satisfies IncomingPendingPlayInvite;
    })
    .filter(
      (
        entry
      ): entry is IncomingPendingPlayInvite | PendingSentPlayInvite => Boolean(entry)
    );
}

function normalizeConnections(value: unknown): ActiveProfileConnection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const candidate = entry as Record<string, unknown>;
      const participant = normalizeParticipant(candidate.participant);

      if (
        typeof candidate.id !== "string" ||
        typeof candidate.connectedAt !== "string" ||
        typeof candidate.createdAt !== "string" ||
        !participant
      ) {
        return null;
      }

      return {
        id: candidate.id,
        connectedAt: candidate.connectedAt,
        createdAt: candidate.createdAt,
        message: typeof candidate.message === "string" ? candidate.message : null,
        participant,
        sourcePostTitle:
          typeof candidate.sourcePostTitle === "string"
            ? candidate.sourcePostTitle
            : null,
      } satisfies ActiveProfileConnection;
    })
    .filter((entry): entry is ActiveProfileConnection => Boolean(entry));
}

function normalizeStackRequests(value: unknown): IncomingPendingStackRequest[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }

      const candidate = entry as Record<string, unknown>;
      const requester =
        candidate.requester &&
        typeof candidate.requester === "object" &&
        !Array.isArray(candidate.requester)
          ? (candidate.requester as Record<string, unknown>)
          : null;

      if (
        typeof candidate.id !== "string" ||
        typeof candidate.createdAt !== "string" ||
        typeof candidate.postId !== "string" ||
        typeof candidate.postTitle !== "string" ||
        (candidate.requestedRole !== "tank" &&
          candidate.requestedRole !== "dps" &&
          candidate.requestedRole !== "support") ||
        !requester ||
        typeof requester.profileId !== "string"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        createdAt: candidate.createdAt,
        postId: candidate.postId,
        postTitle: candidate.postTitle,
        requestedRole: candidate.requestedRole,
        requester: {
          profileId: requester.profileId,
          avatarUrl:
            typeof requester.avatarUrl === "string" ? requester.avatarUrl : null,
          displayName:
            typeof requester.displayName === "string"
              ? requester.displayName
              : null,
          rankTier:
            typeof requester.rankTier === "string" ? requester.rankTier : null,
          rankDivision:
            typeof requester.rankDivision === "number"
              ? requester.rankDivision
              : null,
          username:
            typeof requester.username === "string" ? requester.username : null,
        },
      } satisfies IncomingPendingStackRequest;
    })
    .filter((entry): entry is IncomingPendingStackRequest => Boolean(entry));
}

async function callRpc<T>(name: string, params: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, params);

  if (error) {
    throw error;
  }

  return (data ?? null) as T;
}

export async function getMatchesPageDto(currentProfileId: string): Promise<MatchesPageDto> {
  const tTotal = stacksPerfStart();
  const tRpc = stacksPerfStart();
  const data = await callRpc<Record<string, unknown>>("get_matches_page_dto", {
    p_current_profile_id: currentProfileId,
  });
  matchesPerfLog("getMatchesPageDto rpc", tRpc);

  const tNormalize = stacksPerfStart();
  const dto = {
    connections: normalizeConnections(data.connections),
    incomingInvites: normalizePendingInviteArray(
      data.incomingInvites
    ) as IncomingPendingPlayInvite[],
    outgoingInvites: normalizePendingInviteArray(
      data.outgoingInvites
    ) as PendingSentPlayInvite[],
  };
  matchesPerfLog(
    "getMatchesPageDto normalize",
    tNormalize,
    dto.connections.length + dto.incomingInvites.length + dto.outgoingInvites.length
  );
  matchesPerfLog(
    "getMatchesPageDto total",
    tTotal,
    dto.connections.length + dto.incomingInvites.length + dto.outgoingInvites.length
  );

  return dto;
}

export async function getNotificationsMenuDto(
  currentProfileId: string
): Promise<NotificationsMenuDto> {
  const tTotal = stacksPerfStart();
  const tRpc = stacksPerfStart();
  const [data, activeConnections] = await Promise.all([
    callRpc<Record<string, unknown>>("get_notifications_menu_dto", {
      p_current_profile_id: currentProfileId,
    }),
    getActiveProfileConnections({ currentProfileId, limit: 12 }),
  ]);
  notificationsPerfLog("getNotificationsMenuDto rpc", tRpc);
  const tNormalize = stacksPerfStart();
  const incomingInvites = normalizePendingInviteArray(
    data.incomingInvites
  ) as IncomingPendingPlayInvite[];
  const stackRequests = normalizeStackRequests(data.stackRequests);
  const recentConnections = activeConnections.filter((connection) => {
    const connectedAt = new Date(connection.connectedAt).getTime();

    return (
      Number.isFinite(connectedAt) &&
      Date.now() - connectedAt <= ACCEPTED_CONNECTION_NOTIFICATION_WINDOW_MS
    );
  });
  const threadHrefsByPeerProfileId =
    recentConnections.length > 0
      ? await getSocialThreadHrefMapByPeerProfileId(
          recentConnections.map((connection) => connection.participant.profileId)
        )
      : {};
  const acceptedConnections = recentConnections.map((connection) => ({
    connectedAt: connection.connectedAt,
    id: connection.id,
    participant: connection.participant,
    sourcePostTitle: connection.sourcePostTitle,
    threadHref: threadHrefsByPeerProfileId[connection.participant.profileId] ?? null,
  }));

  const dto = {
    acceptedConnections,
    incomingInvites,
    stackRequests,
    totalCount: incomingInvites.length + stackRequests.length + acceptedConnections.length,
  };
  notificationsPerfLog("getNotificationsMenuDto normalize", tNormalize, dto.totalCount);
  notificationsPerfLog("getNotificationsMenuDto total", tTotal, dto.totalCount);

  return dto;
}
