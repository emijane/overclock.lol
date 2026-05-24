import { LFGPageLoading } from "@/features/lfg/components/lfg-page-loading";

export default function Loading() {
  return (
    <LFGPageLoading
      breadcrumb
      composerOnly
      showDescription={false}
      title="/ Create a Post"
      tone="duos"
    />
  );
}
