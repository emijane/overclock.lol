import type { Metadata } from "next";

import { LFGPageShell } from "@/app/lfg/components/lfg-page-shell";
import { parseLFGFeedFilters } from "@/lib/lfg/lfg-feed-filters";
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
  const feedFilters =
    config.type === "duos" || config.type === "stacks"
      ? parseLFGFeedFilters({
          lookingFor: pickValue(params.looking_for),
          maxRank: pickValue(params.max_rank),
          minRank: pickValue(params.min_rank),
          mode: pickValue(params.mode),
          region: pickValue(params.region),
          role: pickValue(params.role),
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
