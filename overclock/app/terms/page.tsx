import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service | overclock.lol",
  description: "Read the Terms of Service for overclock.lol.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      description="Rules, responsibilities, and platform terms for using overclock.lol."
      fileName="TERMS_OF_SERVICE.md"
      title="Terms of Service"
    />
  );
}
