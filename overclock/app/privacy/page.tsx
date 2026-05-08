import type { Metadata } from "next";

import { LegalDocument } from "@/app/legal/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy | overclock.lol",
  description: "Read the Privacy Policy for overclock.lol.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      description="How overclock.lol collects, uses, stores, and shares account and platform data."
      fileName="PRIVACY_POLICY.md"
      title="Privacy Policy"
    />
  );
}
