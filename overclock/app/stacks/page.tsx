import {
  buildLFGSectionMetadata,
  LFGSectionPage,
  type LFGSectionConfig,
  type LFGSectionPageProps,
} from "@/app/lfg/section-page";

const STACKS_PAGE_CONFIG = {
  title: "Stacks",
  description: "Build a group for flexible sessions or full team queue.",
  helperText: "For groups of 3-5 players and flexible sessions.",
  filtersDescription:
    "Browse the latest stack listings for flexible sessions and group queue.",
  emptyStateTitle: "No stacks yet",
  emptyStateDescription: "Create a post to start building a group.",
  metadataDescription:
    "Browse stack posts and create a listing for 3-5 player groups.",
  type: "stacks",
} satisfies LFGSectionConfig;

export const metadata = buildLFGSectionMetadata(STACKS_PAGE_CONFIG);

export default function StacksPage(props: LFGSectionPageProps) {
  return <LFGSectionPage config={STACKS_PAGE_CONFIG} {...props} />;
}
