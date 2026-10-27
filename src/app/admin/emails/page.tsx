import type { Metadata } from "next";
import Link from "next/link";

import { saveEmailTemplateAction, sendCampaignAction } from "@/app/admin/actions/marketing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { env, isEmailConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Emails",
  robots: { index: false, follow: false },
};

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
        <p className="mt-1 text-sm text-mocha">
          Brand templates and the campaign sender. Transactional emails use built-in layouts.
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
          <p className="text-sm text-mocha">
            Editable copy for campaigns and reference for the automated emails. Placeholders use
            double braces, e.g. {"{{order_number}}"}.
          </p>
          {templates.map((template) => (
            <details key={template.id} className="border border-line bg-cream">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm text-espresso">{template.name}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={template.isActive ? "success" : "neutral"}>
                    {template.isActive ? "Active" : "Hidden"}
                  </Badge>
                  <span className="text-[0.62rem] uppercase tracking-[0.12em] text-mocha">
                    {formatDateTime(template.updatedAt)}
                  </span>
                </span>
              </summary>
              <form action={saveEmailTemplateAction} className="space-y-4 border-t border-line p-4">
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
                <Field label="HTML body" htmlFor={`tpl-body-${template.id}`}>
                  <Textarea
                    id={`tpl-body-${template.id}`}
                    name="bodyHtml"
                    defaultValue={template.bodyHtml}
                    className="min-h-40 font-mono text-xs"
                    required
                  />
                </Field>
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
          ))}
        </div>
      ) : null}

      {tab === "campaigns" ? (
        <div className="space-y-6">
          <form
            action={sendCampaignAction}
            className="space-y-4 border border-gold/40 bg-gold/10 p-4"
          >
            <div>
              <h2 className="font-display text-xl text-espresso">Compose a campaign</h2>
              <p className="mt-1 text-xs text-mocha">
                Up to 200 recipients per run. Every email includes a one-click unsubscribe link.
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
            <h2 className="font-display text-xl text-espresso">Recent campaigns</h2>
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


