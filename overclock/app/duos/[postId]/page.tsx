import type { Metadata } from "next";

import { DuoDetailPage } from "@/features/lfg/components/duo-detail-page";

type DuoDetailRouteProps = {
  params: Promise<{ postId: string }>;
};

export const metadata: Metadata = {
  title: "Duo Post | overclock.lol",
  description: "View a Duo LFG post, copy the link, and connect with the player.",
};

export default async function DuoDetailRoute({ params }: DuoDetailRouteProps) {
  const { postId } = await params;
  return <DuoDetailPage postId={postId} />;
}
