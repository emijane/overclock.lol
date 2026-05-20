import { createClient } from "@/lib/supabase/server";

import { normalizeProfilePageDto } from "./profile-page-dto/parsers";

export type { ProfilePageDto, RecentProfilePostDto } from "./profile-page-dto/types";

export async function getProfilePageDto(
  username: string,
  viewerProfileId?: string | null
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_profile_page_dto", {
    p_username: username,
    p_viewer_profile_id: viewerProfileId ?? null,
  });

  if (error) {
    throw error;
  }

  return normalizeProfilePageDto(data);
}
