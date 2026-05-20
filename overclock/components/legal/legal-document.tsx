import { readFile } from "node:fs/promises";
import path from "node:path";

import { DarkPageShell } from "@/components/app-shell/dark-page-shell";

type LegalDocumentProps = {
  description: string;
  fileName: "PRIVACY_POLICY.md" | "TERMS_OF_SERVICE.md";
  title: string;
};

type MarkdownNode =
  | { type: "heading1"; text: string }
  | { type: "heading2"; text: string }
  | { type: "heading3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

function renderInlineCode(text: string) {
  const segments = text.split(/(`[^`]+`)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code
          key={`${segment}-${index}`}
          className="rounded bg-white/6 px-1.5 py-0.5 text-[0.95em] text-zinc-100"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function parseMarkdown(markdown: string): MarkdownNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const nodes: MarkdownNode[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length === 0) {
      return;
    }

    nodes.push({
      type: "paragraph",
      text: paragraphBuffer.join(" ").trim(),
    });
    paragraphBuffer = [];
  }

  function flushList() {
    if (listBuffer.length === 0) {
      return;
    }

    nodes.push({
      type: "list",
      items: [...listBuffer],
    });
    listBuffer = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "heading1", text: line.slice(2).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "heading2", text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      nodes.push({ type: "heading3", text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listBuffer.push(line.slice(2).trim());
      continue;
    }

    flushList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return nodes;
}

async function loadLegalMarkdown(fileName: LegalDocumentProps["fileName"]) {
  const filePath = path.resolve(process.cwd(), "..", "docs", "legal", fileName);
  return readFile(filePath, "utf8");
}

export async function LegalDocument({
  description,
  fileName,
  title,
}: LegalDocumentProps) {
  const markdown = await loadLegalMarkdown(fileName);
  const nodes = parseMarkdown(markdown);

  return (
    <DarkPageShell
      className="py-4 sm:py-5"
      containerClassName="flex flex-col gap-2.5"
      maxWidthClassName="max-w-4xl"
    >
        <section className="rounded-[28px]">
          <div className="overflow-hidden rounded-[28px]">
            <header className="py-3 sm:py-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Legal
                </p>
                <h1 className="text-3xl font-semibold tracking-[-0.07em] text-zinc-50 sm:text-4xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                  {description}
                </p>
              </div>
            </header>

            <div className="oc-surface-panel overflow-hidden rounded-[22px]">
              <div className="px-5 py-4 sm:px-6 sm:py-5">
                <div className="space-y-4">
                  {nodes.map((node, index) => {
                    if (node.type === "heading1") {
                      return (
                        <h2
                          key={`${node.type}-${index}`}
                          className="text-2xl font-semibold tracking-[-0.05em] text-zinc-50"
                        >
                          {node.text}
                        </h2>
                      );
                    }

                    if (node.type === "heading2") {
                      return (
                        <h3
                          key={`${node.type}-${index}`}
                          className="pt-1 text-[15px] font-semibold tracking-[-0.02em] text-zinc-100"
                        >
                          {node.text}
                        </h3>
                      );
                    }

                    if (node.type === "heading3") {
                      return (
                        <h4
                          key={`${node.type}-${index}`}
                          className="text-[13px] font-semibold tracking-[-0.01em] text-zinc-300"
                        >
                          {node.text}
                        </h4>
                      );
                    }

                    if (node.type === "list") {
                      return (
                        <ul
                          key={`${node.type}-${index}`}
                          className="grid gap-1.5 text-sm leading-6 text-zinc-300"
                        >
                          {node.items.map((item, itemIndex) => (
                            <li key={`${item}-${itemIndex}`} className="flex gap-2.5">
                              <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                              <span>{renderInlineCode(item)}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    return (
                      <p
                        key={`${node.type}-${index}`}
                        className="text-sm leading-6 text-zinc-400"
                      >
                        {renderInlineCode(node.text)}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
    </DarkPageShell>
  );
}
