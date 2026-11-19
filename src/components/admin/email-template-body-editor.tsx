"use client";

import { useId, useState } from "react";

import { Field, FieldHint, Textarea } from "@/components/ui/form";
import {
  EMAIL_MERGE_TAGS,
  EMAIL_PLAIN_TEXT_GUIDE,
  emailHtmlToPlain,
  emailPlainToHtml,
} from "@/lib/email/plain-text";
import { cn } from "@/lib/utils";

type BodyMode = "plain" | "html";

const TABS: Array<{ id: BodyMode; label: string }> = [
  { id: "plain", label: "Plain text" },
  { id: "html", label: "HTML" },
];

export function EmailTemplateBodyEditor({
  id,
  defaultValue,
}: {
  id: string;
  defaultValue: string;
}) {
  const baseId = useId();
  const [mode, setMode] = useState<BodyMode>("plain");
  const [plainText, setPlainText] = useState(() => emailHtmlToPlain(defaultValue));
  const [html, setHtml] = useState(defaultValue);

  const plainTabId = `${baseId}-plain-tab`;
  const htmlTabId = `${baseId}-html-tab`;
  const panelId = `${baseId}-panel`;
  const activeTabId = mode === "plain" ? plainTabId : htmlTabId;

  function changeMode(next: BodyMode) {
    if (next === mode) return;

    if (next === "html") {
      setHtml(emailPlainToHtml(plainText));
    } else {
      setPlainText(emailHtmlToPlain(html));
    }

    setMode(next);
  }

  return (
    <Field label="Email body" htmlFor={id}>
      <input type="hidden" name="bodyMode" value={mode} />

      <div
        role="tablist"
        aria-label="Email body format"
        className="mb-0 flex flex-wrap gap-1 border-b border-line"
      >
        {TABS.map((tab) => {
          const tabId = tab.id === "plain" ? plainTabId : htmlTabId;
          const selected = mode === tab.id;

          return (
            <button
              key={tab.id}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              onClick={() => changeMode(tab.id)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition-colors",
                selected
                  ? "border-ink bg-cream/60 text-espresso"
                  : "border-transparent text-mocha hover:bg-cream/50 hover:text-espresso",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={panelId} aria-labelledby={activeTabId} className="pt-3">
        <Textarea
          id={id}
          name="bodyHtml"
          value={mode === "plain" ? plainText : html}
          onChange={(event) => {
            if (mode === "plain") setPlainText(event.target.value);
            else setHtml(event.target.value);
          }}
          required
          spellCheck={mode === "plain"}
          className={cn(
            "min-h-64",
            mode === "html" ? "font-mono text-xs leading-relaxed" : "leading-relaxed",
          )}
        />
        <FieldHint>
          {mode === "plain"
            ? "Write normally — the branded atelier layout is applied when you save."
            : "Advanced: this HTML is stored exactly as written."}
        </FieldHint>

        <details className="mt-3 border border-line bg-ivory/70">
          <summary className="cursor-pointer px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-espresso">
            Formatting &amp; merge tags
          </summary>
          <div className="space-y-4 border-t border-line px-3 py-3 text-xs leading-relaxed text-mocha">
            <ul className="grid gap-2 sm:grid-cols-2">
              {EMAIL_PLAIN_TEXT_GUIDE.map((item) => (
                <li key={item.syntax} className="border border-line/70 bg-white/50 px-2.5 py-2">
                  <code className="text-[0.7rem] text-espresso">{item.syntax}</code>
                  <p className="mt-1 text-[0.68rem] leading-relaxed text-mocha">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>

            <div>
              <p className="mb-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-espresso">
                Merge tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {EMAIL_MERGE_TAGS.map((tag) => (
                  <code
                    key={tag}
                    className="bg-cream px-1.5 py-0.5 text-[0.68rem] text-espresso"
                  >
                    {`{{${tag}}}`}
                  </code>
                ))}
              </div>
              <p className="mt-2 text-[0.68rem] leading-relaxed text-mocha">
                Tags that expand to a full block, such as{" "}
                <code className="bg-cream px-1.5 py-0.5 text-[0.68rem] text-espresso">
                  {"{{order_summary}}"}
                </code>{" "}
                and{" "}
                <code className="bg-cream px-1.5 py-0.5 text-[0.68rem] text-espresso">
                  {"{{guest_setup_block}}"}
                </code>
                , should sit on their own line. Inline tags work inside copy.
              </p>
            </div>

            <p>
              Need markup this editor does not cover? Switch to the HTML tab, or wrap a single
              block in <code className="bg-cream px-1.5 py-0.5 text-[0.7rem]">{`\`\`\`html`}</code>{" "}
              and close it with{" "}
              <code className="bg-cream px-1.5 py-0.5 text-[0.7rem]">{"\`\`\`"}</code>.
            </p>
          </div>
        </details>
      </div>
    </Field>
  );
}
