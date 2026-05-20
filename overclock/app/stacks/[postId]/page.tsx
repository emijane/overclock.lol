import type { Metadata } from "next";

import { StackDetailPage } from "@/features/lfg/components/stack-detail-page";

type StackDetailRouteProps = {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const metadata: Metadata = {
  title: "Stack Detail | overclock.lol",
  description: "View the current members, request state, and supported actions for a stack post.",
};

export default async function StackDetailRoute({
  params,
  searchParams,
}: StackDetailRouteProps) {
  const { postId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <StackDetailPage
      message={pickValue(resolvedSearchParams.message)}
      messageType={pickValue(resolvedSearchParams.type)}
      postId={postId}
    />
  );
}
