import {
  buildLFGSectionMetadata,
  LFGSectionPage,
  type LFGSectionConfig,
  type LFGSectionPageProps,
} from "@/app/lfg/section-page";

const SCRIMS_PAGE_CONFIG = {
  title: "Scrims",
  description: "Organize practice blocks, tryouts, and competitive reps.",
  metadataDescription:
    "Browse scrim posts and organize practice blocks, tryouts, and team reps.",
  type: "scrims",
} satisfies LFGSectionConfig;

export const metadata = buildLFGSectionMetadata(SCRIMS_PAGE_CONFIG);

export default function ScrimsPage(props: LFGSectionPageProps) {
  return <LFGSectionPage config={SCRIMS_PAGE_CONFIG} {...props} />;
}
