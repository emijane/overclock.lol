import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  title?: string;
};

export function SectionCard({ children, title }: SectionCardProps) {
  return (
    <section className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 px-4 py-4">
      {title ? (
        <h3 className="mb-4 text-sm font-semibold tracking-[-0.02em] text-zinc-100">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}
