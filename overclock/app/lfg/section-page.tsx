import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LFGPageShell } from "@/app/lfg/components/lfg-page-shell";
import {
  normalizeLFGRankFilterOption,
  normalizeLFGRankBounds,
  parseLFGFeedFilters,
} from "@/lib/lfg/lfg-feed-filters";
import type { LFGType } from "@/lib/lfg/lfg-post-types";

type LFGSectionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type LFGSectionConfig = {
  composerMode?: "cta" | "inline" | "none";
  createPostHref?: string;
  description: string;
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  filtersDescription?: string;
  helperText?: string;
  metadataDescription?: string;
  showFeed?: boolean;
  title: string;
  type: LFGType;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildCanonicalSearchParams(
  input: Record<string, string | string[] | undefined>
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
      continue;
    }

    if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

export function buildLFGSectionMetadata({
  metadataDescription,
  title,
}: LFGSectionConfig): Metadata {
  return {
    title: `${title} | overclock.lol`,
    description: metadataDescription ?? `${title} posts on overclock.lol.`,
  };
}

export async function LFGSectionPage({
  config,
  searchParams,
}: LFGSectionPageProps & {
  config: LFGSectionConfig;
}) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);
  const rawMinRank = pickValue(params.min_rank);
  const rawMaxRank = pickValue(params.max_rank);
  const normalizedRankBounds = normalizeLFGRankBounds({
    maxRank: normalizeLFGRankFilterOption(rawMaxRank),
    minRank: normalizeLFGRankFilterOption(rawMinRank),
  });

  if (
    (config.type === "duos" || config.type === "stacks") &&
    normalizedRankBounds.minRank &&
    normalizedRankBounds.maxRank &&
    (normalizedRankBounds.minRank !== rawMinRank ||
      normalizedRankBounds.maxRank !== rawMaxRank)
  ) {
    const canonicalSearchParams = buildCanonicalSearchParams(params);
    canonicalSearchParams.set("min_rank", normalizedRankBounds.minRank);
    canonicalSearchParams.set("max_rank", normalizedRankBounds.maxRank);

    const query = canonicalSearchParams.toString();
    redirect(query ? `/${config.type}?${query}` : `/${config.type}`);
  }

  const feedFilters =
    config.type === "duos" || config.type === "stacks"
      ? parseLFGFeedFilters({
          lookingFor: pickValue(params.looking_for),
          maxRank: rawMaxRank,
          minRank: rawMinRank,
          mode: pickValue(params.mode),
          region: pickValue(params.region),
          role: pickValue(params.role),
          search: pickValue(params.search),
        })
      : undefined;

  return (
    <LFGPageShell
      description={config.description}
      composerMode={config.composerMode}
      createPostHref={config.createPostHref}
      emptyStateDescription={config.emptyStateDescription}
      emptyStateTitle={config.emptyStateTitle}
      feedFilters={feedFilters}
      filtersDescription={config.filtersDescription}
      helperText={config.helperText}
      message={message}
      messageType={messageType}
      showFeed={config.showFeed}
      title={config.title}
      type={config.type}
    />
  );
}

export type { LFGSectionConfig, LFGSectionPageProps };
