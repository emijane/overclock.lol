import { LFGPageShell } from "@/app/lfg/components/lfg-page-shell";

type DuosPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DuosPage({ searchParams }: DuosPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = pickValue(params.message);
  const messageType = pickValue(params.type);

  return (
    <LFGPageShell
      title="Duos"
      description="Find one teammate for ranked or casual queue."
      message={message}
      messageType={messageType}
      type="duos"
    />
  );
}
