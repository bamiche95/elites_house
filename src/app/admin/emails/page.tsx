import type { Metadata } from "next";
import Link from "next/link";

import { saveEmailTemplateAction, sendCampaignAction } from "@/app/admin/actions/marketing";
import { EmailTemplateBodyEditor } from "@/components/admin/email-template-body-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { siteConfig } from "@/lib/constants";
import { renderTemplatePreview } from "@/lib/email/template-copy";
import { emailLayout } from "@/lib/email/templates";
import { env, isEmailConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Emails",
  robots: { index: false, follow: false },
};

function formatTemplateName(name: string) {
  const words = name.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function previewForTemplate(template: {
  subject: string;
  preheader: string | null;
  bodyHtml: string;
}) {
  return emailLayout({
    title: template.subject,
    preheader: template.preheader ?? template.subject,
    content: renderTemplatePreview(template.bodyHtml, siteConfig.url),
    footerNote: "Preview with sample data — live emails use the same atelier shell.",
    unsubscribeUrl: `${siteConfig.url}/unsubscribe?token=preview`,
  });
}

export default async function AdminEmailsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    saved?: string;
    error?: string;
    sent?: string;
    failed?: string;
  }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "campaigns" ? "campaigns" : "templates";

  const [templates, campaigns, optedIn, subscribers] = await Promise.all([
    prisma.emailTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.emailCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.user.count({ where: { marketingOptIn: true } }),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-espresso">Emails</h1>
        <p className="mt-1 max-w-2xl text-sm text-mocha">
          Every outbound email shares one atelier shell — ivory, espresso and a gold keyline.
          Preview each template with sample data, then edit the copy stored for campaigns.
        </p>
      </div>

      <div
        className={
          isEmailConfigured
            ? "border border-success/30 bg-success/5 px-4 py-3 text-xs text-success"
            : "border border-gold/40 bg-gold/10 px-4 py-3 text-xs text-mocha"
        }
      >
        {isEmailConfigured
          ? `Sending via ${env.emailProvider === "sendgrid" ? "SendGrid" : "Resend"} as ${env.emailFrom}.`
          : "No email provider configured — sends are logged as SKIPPED so you can still test the flow."}
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-line pb-3">
        {[
          { id: "templates", label: "Templates" },
          { id: "campaigns", label: "Campaigns" },
        ].map((item) => (
          <Link
            key={item.id}
            href={`/admin/emails?tab=${item.id}`}
            className={
              tab === item.id
                ? "bg-ink px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-ivory"
                : "px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-mocha hover:bg-cream hover:text-espresso"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {params.saved ? (
        <p className="border border-success/30 bg-success/5 px-4 py-3 text-xs text-success">
          Saved.
        </p>
      ) : null}
      {params.error ? (
        <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger">
          {params.error}
        </p>
      ) : null}
      {params.sent ? (
        <p className="border border-success/30 bg-success/5 px-4 py-3 text-xs text-success">
          Campaign queued for {params.sent} recipient{params.sent === "1" ? "" : "s"}
          {params.failed ? ` · ${params.failed} failed` : ""}.
        </p>
      ) : null}

      {tab === "templates" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-cream/60 px-4 py-3">
            <p className="text-sm text-mocha">
              Editable copy for campaigns and reference for the automated sends. Placeholders use
              double braces, e.g.{" "}
              <code className="bg-ivory px-1.5 py-0.5 text-[0.7rem] text-espresso">
                {"{{order_number}}"}
              </code>
              .
            </p>
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-gold">
              600px &middot; Gmail / Outlook safe
            </span>
          </div>
          {templates.length === 0 ? (
            <p className="border border-dashed border-line bg-cream/40 px-4 py-6 text-sm text-mocha">
              No templates found. Run{" "}
              <code className="bg-ivory px-1.5 py-0.5 text-[0.7rem] text-espresso">
                npm run emails:refresh
              </code>{" "}
              to load the branded copy.
            </p>
          ) : null}
          {templates.map((template) => (
            <article key={template.id} className="overflow-hidden border border-line bg-ivory">
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-gold">
                    Template
                  </p>
                  <h2 className="mt-1 font-display text-xl text-espresso">
                    {formatTemplateName(template.name)}
                  </h2>
                  {template.description ? (
                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-mocha">
                      {template.description}
                    </p>
                  ) : null}
                  <p className="mt-2 truncate text-[0.65rem] text-mocha/80">
                    Subject &middot; {template.subject}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <Badge tone={template.isActive ? "success" : "neutral"}>
                    {template.isActive ? "Active" : "Hidden"}
                  </Badge>
                  <span className="text-[0.58rem] uppercase tracking-[0.12em] text-mocha">
                    Updated {formatDateTime(template.updatedAt)}
                  </span>
                </div>
              </header>
              <div className="border-b border-line bg-cream/40 px-3 py-4 sm:px-5">
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <span className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-mocha">
                    Brand preview
                  </span>
                  <span className="text-[0.58rem] uppercase tracking-[0.12em] text-mocha/70">
                    Sample data
                  </span>
                </div>
                <div className="overflow-hidden border border-line bg-ivory shadow-[0_24px_50px_-42px_rgba(23,17,14,0.65)]">
                  <div className="flex items-center gap-2 border-b border-line bg-cream px-3 py-2">
                    <span className="flex gap-1" aria-hidden="true">
                      <span className="h-1.5 w-1.5 rounded-full bg-sand" />
                      <span className="h-1.5 w-1.5 rounded-full bg-sand" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gold/60" />
                    </span>
                    <span className="truncate text-[0.6rem] tracking-[0.08em] text-mocha">
                      mail.theeliteshouse.com
                    </span>
                  </div>
                  <iframe
                    title={`${formatTemplateName(template.name)} email preview`}
                    srcDoc={previewForTemplate(template)}
                    sandbox=""
                    loading="lazy"
                    className="h-[36rem] w-full bg-ivory"
                  />
                </div>
              </div>
              <details className="group">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-cream/50">
                  <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-espresso">
                    Edit copy
                  </span>
                  <span className="text-[0.6rem] uppercase tracking-[0.12em] text-mocha group-open:hidden">
                    Open editor
                  </span>
                  <span className="hidden text-[0.6rem] uppercase tracking-[0.12em] text-mocha group-open:inline">
                    Close
                  </span>
                </summary>
              <form
                action={saveEmailTemplateAction}
                className="space-y-4 border-t border-line bg-cream/30 p-5"
              >
                <input type="hidden" name="id" value={template.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Template name" htmlFor={`tpl-name-${template.id}`}>
                    <Input
                      id={`tpl-name-${template.id}`}
                      name="name"
                      defaultValue={template.name}
                      required
                    />
                  </Field>
                  <Field label="Description" htmlFor={`tpl-desc-${template.id}`}>
                    <Input
                      id={`tpl-desc-${template.id}`}
                      name="description"
                      defaultValue={template.description ?? ""}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Subject" htmlFor={`tpl-subject-${template.id}`}>
                    <Input
                      id={`tpl-subject-${template.id}`}
                      name="subject"
                      defaultValue={template.subject}
                      required
                    />
                  </Field>
                  <Field label="Preheader" htmlFor={`tpl-preheader-${template.id}`}>
                    <Input
                      id={`tpl-preheader-${template.id}`}
                      name="preheader"
                      defaultValue={template.preheader ?? ""}
                    />
                  </Field>
                </div>
                <EmailTemplateBodyEditor
                  id={`tpl-body-${template.id}`}
                  defaultValue={template.bodyHtml}
                />
                <Checkbox
                  id={`tpl-active-${template.id}`}
                  name="isActive"
                  defaultChecked={template.isActive}
                  label="Active"
                />
                <Button type="submit" size="sm">
                  Save template
                </Button>
              </form>
              </details>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "campaigns" ? (
        <div className="space-y-6">
          <form
            action={sendCampaignAction}
            className="space-y-4 border border-line border-t-2 border-t-gold bg-cream/40 p-4 sm:p-5"
          >
            <div>
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-gold">
                Campaign sender
              </p>
              <h2 className="mt-1 font-display text-xl text-espresso">Compose a campaign</h2>
              <p className="mt-1 max-w-2xl text-xs text-mocha">
                Sent through the shared atelier shell. Up to 200 recipients per run, and every
                email includes a one-click unsubscribe link.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Internal name" htmlFor="campaign-name">
                <Input id="campaign-name" name="name" required maxLength={80} />
              </Field>
              <Field label="Audience" htmlFor="campaign-audience">
                <Select id="campaign-audience" name="audience" defaultValue="ALL_CUSTOMERS">
                  <option value="ALL_CUSTOMERS">All opted-in customers ({optedIn})</option>
                  <option value="ACCOUNT_HOLDERS">Account holders ({optedIn})</option>
                  <option value="NEWSLETTER">Newsletter subscribers ({subscribers})</option>
                </Select>
              </Field>
            </div>
            <Field label="Subject line" htmlFor="campaign-subject">
              <Input id="campaign-subject" name="subject" required maxLength={160} />
            </Field>
            <Field label="Message (HTML)" htmlFor="campaign-body">
              <Textarea
                id="campaign-body"
                name="bodyHtml"
                required
                className="min-h-48 font-mono text-xs"
                placeholder="<h2>The Autumn Edit</h2><p>New batches have landed…</p>"
              />
            </Field>
            <Button type="submit">Send campaign</Button>
          </form>

          <section>
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-gold">
              History
            </p>
            <h2 className="mt-1 font-display text-xl text-espresso">Recent campaigns</h2>
            <div className="mt-3 overflow-x-auto border border-line">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="bg-cream text-[0.6rem] uppercase tracking-[0.16em] text-mocha">
                  <tr>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Recipients</th>
                    <th className="px-4 py-3">Failures</th>
                    <th className="px-4 py-3">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="bg-ivory">
                      <td className="px-4 py-3">
                        <p className="text-espresso">{campaign.name}</p>
                        <p className="text-[0.65rem] text-mocha">{campaign.subject}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            campaign.status === "SENT"
                              ? "success"
                              : campaign.status === "FAILED"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-mocha">{campaign.recipientCount}</td>
                      <td className="px-4 py-3 text-xs text-mocha">{campaign.failureCount}</td>
                      <td className="px-4 py-3 text-xs text-mocha">
                        {campaign.sentAt ? formatDateTime(campaign.sentAt) : "—"}
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-mocha">
                        No campaigns sent yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}


