import { getCurrentProfileIdentity } from "@/lib/profiles/get-current-profile";

import { GlobalSidebarNav } from "./global-sidebar-nav";

export async function GlobalSidebarNavServer() {
  const { user, profile } = await getCurrentProfileIdentity();
  const profileHref = profile?.username ? `/u/${profile.username}` : null;

  return <GlobalSidebarNav profileHref={profileHref} signedIn={Boolean(user && profile)} />;
}
