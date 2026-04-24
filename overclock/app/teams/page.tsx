import {
  buildLFGSectionMetadata,
  LFGSectionPage,
  type LFGSectionConfig,
  type LFGSectionPageProps,
} from "@/app/lfg/section-page";

const TEAMS_PAGE_CONFIG = {
  title: "Teams",
  description: "Recruit for longer-term rosters, roles, and organized play.",
  metadataDescription:
    "Browse team posts and recruit for longer-term rosters and organized play.",
  type: "teams",
} satisfies LFGSectionConfig;

export const metadata = buildLFGSectionMetadata(TEAMS_PAGE_CONFIG);

export default function TeamsPage(props: LFGSectionPageProps) {
  return <LFGSectionPage config={TEAMS_PAGE_CONFIG} {...props} />;
}
