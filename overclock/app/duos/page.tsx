import {
  buildLFGSectionMetadata,
  LFGSectionPage,
  type LFGSectionConfig,
  type LFGSectionPageProps,
} from "@/app/lfg/section-page";

const DUOS_PAGE_CONFIG = {
  title: "Duos",
  description: "Find one teammate for ranked or casual queue.",
  metadataDescription:
    "Browse duo posts and create a duo listing for ranked or casual queue.",
  type: "duos",
} satisfies LFGSectionConfig;

export const metadata = buildLFGSectionMetadata(DUOS_PAGE_CONFIG);

export default function DuosPage(props: LFGSectionPageProps) {
  return <LFGSectionPage config={DUOS_PAGE_CONFIG} {...props} />;
}
