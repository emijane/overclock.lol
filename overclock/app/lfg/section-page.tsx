import type { Metadata } from "next";

import { LFGPageShell } from "@/app/lfg/components/lfg-page-shell";
import type { LFGType } from "@/lib/lfg/lfg-post-types";

type LFGSectionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type LFGSectionConfig = {
  description: string;
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  filtersDescription?: string;
  helperText?: string;
  metadataDescription?: string;
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

  return (
    <LFGPageShell
      description={config.description}
      emptyStateDescription={config.emptyStateDescription}
      emptyStateTitle={config.emptyStateTitle}
      filtersDescription={config.filtersDescription}
      helperText={config.helperText}
      message={message}
      messageType={messageType}
      title={config.title}
      type={config.type}
    />
  );
}

export type { LFGSectionConfig, LFGSectionPageProps };
