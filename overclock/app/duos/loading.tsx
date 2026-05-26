import { LFGPageLoading } from "@/features/lfg/components/lfg-page-loading";

export default function Loading() {
  return (
    <LFGPageLoading
      composerCta
      feedLoading="cards"
      feedVariant="duos"
      title="Duos"
      tone="duos"
    />
  );
}
