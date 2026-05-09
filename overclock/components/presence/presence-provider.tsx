"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { updateLastSeen } from "@/app/account/actions";
import { createClient } from "@/lib/supabase/client";

const PRESENCE_CHANNEL = "presence:profiles";
const LAST_SEEN_WRITE_INTERVAL_MS = 2 * 60 * 1000;
const LAST_SEEN_HEARTBEAT_MS = 60 * 1000;

type PresenceProviderProps = {
  children: React.ReactNode;
  currentUserId?: string | null;
  currentUsername?: string | null;
};

type PresenceContextValue = {
  hasPresenceSession: boolean;
  isReady: boolean;
  isUserOnline: (userId: string | null | undefined) => boolean;
};

const PresenceContext = createContext<PresenceContextValue>({
  hasPresenceSession: false,
  isReady: false,
  isUserOnline: () => false,
});

function collectOnlineUserIds(state: Record<string, Array<{ userId?: string }>>) {
  const nextOnlineIds = new Set<string>();

  Object.values(state).forEach((presences) => {
    presences.forEach((presence) => {
      if (presence.userId) {
        nextOnlineIds.add(presence.userId);
      }
    });
  });

  return nextOnlineIds;
}

export function PresenceProvider({
  children,
  currentUserId,
  currentUsername,
}: PresenceProviderProps) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [isReady, setIsReady] = useState(false);
  const lastSeenWriteAtRef = useRef<number>(0);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const supabase = createClient();
    const tabId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    async function writeLastSeen(force = false) {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      const now = Date.now();

      if (!force && now - lastSeenWriteAtRef.current < LAST_SEEN_WRITE_INTERVAL_MS) {
        return;
      }

      lastSeenWriteAtRef.current = now;
      await updateLastSeen();
    }

    function syncOnlineUsers() {
      const presenceState = channel.presenceState();
      setOnlineUserIds(collectOnlineUserIds(presenceState));
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void writeLastSeen();
      }
    }

    channel
      .on("presence", { event: "sync" }, syncOnlineUsers)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        await channel.track({
          joinedAt: new Date().toISOString(),
          tabId,
          userId: currentUserId,
          username: currentUsername ?? null,
        });

        syncOnlineUsers();
        setIsReady(true);
        void writeLastSeen(true);
      });

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const heartbeatId = window.setInterval(() => {
      void writeLastSeen();
    }, LAST_SEEN_HEARTBEAT_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(heartbeatId);
      setIsReady(false);
      setOnlineUserIds(new Set());
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, currentUsername]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      hasPresenceSession: Boolean(currentUserId),
      isReady,
      isUserOnline: (userId) => (userId ? onlineUserIds.has(userId) : false),
    }),
    [currentUserId, isReady, onlineUserIds]
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  return useContext(PresenceContext);
}
