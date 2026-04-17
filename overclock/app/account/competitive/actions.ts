"use server";

import { redirect } from "next/navigation";

import {
  isCompetitiveRole,
  type CompetitiveRankTier,
} from "@/lib/competitive/competitive-profile-types";
import { RANK_TIERS } from "@/lib/profiles/profile-options";
import { createClient } from "@/lib/supabase/server";

function competitiveRedirect(
  message: string,
  type: "error" | "success" = "error"
): never {
  const params = new URLSearchParams({ type, message });
  redirect(`/account/competitive?${params.toString()}`);
}

function optionalTrimmedString(value: FormDataEntryValue | null) {
  const parsed = value?.toString().trim() ?? "";
  return parsed.length > 0 ? parsed : null;
}

function parseRankDivision(value: FormDataEntryValue | null) {
  const parsed = optionalTrimmedString(value);

  if (!parsed) {
    return null;
  }

  const division = Number(parsed);

  if (!Number.isInteger(division) || division < 1 || division > 5) {
    competitiveRedirect("Invalid rank division.");
  }

  return division;
}

function parseRankTier(value: FormDataEntryValue | null): CompetitiveRankTier {
  const parsed = optionalTrimmedString(value);

  if (!parsed || !RANK_TIERS.includes(parsed as CompetitiveRankTier)) {
    competitiveRedirect("Invalid rank tier.");
  }

  return parsed as CompetitiveRankTier;
}

function validateRankPair(tier: CompetitiveRankTier, division: number | null) {
  if (tier === "Unranked" && division !== null) {
    competitiveRedirect("Division must be empty when rank is Unranked.");
  }

  if (tier !== "Unranked" && division === null) {
    competitiveRedirect("Division is required for ranked roles.");
  }
}

export async function saveCompetitiveRoleProfile(formData: FormData) {
  const rawRole = optionalTrimmedString(formData.get("role"));

  if (!rawRole || !isCompetitiveRole(rawRole)) {
    competitiveRedirect("Invalid competitive role.");
  }

  const rankTier = parseRankTier(formData.get("rank_tier"));
  const rankDivision = parseRankDivision(formData.get("rank_division"));
  const shouldSetMainRole = formData.get("main_role") === "on";
  const wasMainRole = formData.get("was_main_role") === "true";

  validateRankPair(rankTier, rankDivision);

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { error: roleError } = await supabase
    .from("competitive_role_profiles")
    .upsert(
      {
        enabled: true,
        profile_id: user.id,
        rank_division: rankDivision,
        rank_tier: rankTier,
        role: rawRole,
      },
      {
        onConflict: "profile_id,role",
      }
    );

  if (roleError) {
    console.error("Competitive role profile save failed", {
      error: roleError,
      profileId: user.id,
      role: rawRole,
    });
    competitiveRedirect("Unable to save competitive role right now.");
  }

  if (shouldSetMainRole || wasMainRole) {
    const { error: profileError } = await supabase
      .from("competitive_profiles")
      .upsert(
        {
          main_role: shouldSetMainRole ? rawRole : null,
          profile_id: user.id,
        },
        {
          onConflict: "profile_id",
        }
      );

    if (profileError) {
      console.error("Competitive profile main role save failed", {
        error: profileError,
        profileId: user.id,
        role: rawRole,
      });
      competitiveRedirect("Saved rank, but could not set main role.");
    }
  }

  competitiveRedirect("Competitive role saved.", "success");
}
