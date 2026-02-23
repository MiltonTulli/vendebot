/**
 * WhatsApp Broadcast Campaign Manager
 *
 * Handles Meta template submission, approval polling,
 * and batch message sending for marketing campaigns.
 */

import { db } from "@/lib/db";
import {
  campaigns,
  campaignRecipients,
  customers,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

const META_WABA_ID = process.env.META_WABA_ID!;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;
const META_API_VERSION = "v21.0";

// --- Template Management ---

interface TemplateSubmission {
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY";
  body: string;
  params?: string[];
}

/**
 * Submit a WhatsApp message template to Meta for approval.
 */
export async function submitTemplate(submission: TemplateSubmission) {
  const components: Record<string, unknown>[] = [
    {
      type: "BODY",
      text: submission.body,
      ...(submission.params?.length
        ? {
            example: {
              body_text: [submission.params],
            },
          }
        : {}),
    },
  ];

  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${META_WABA_ID}/message_templates`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: submission.name,
        language: submission.language,
        category: submission.category,
        components,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Meta template submission failed: ${JSON.stringify(err)}`);
  }

  return (await res.json()) as { id: string; status: string };
}

/**
 * Check template approval status from Meta.
 */
export async function checkTemplateStatus(templateName: string) {
  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${META_WABA_ID}/message_templates?name=${templateName}`,
    {
      headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` },
    }
  );

  if (!res.ok) throw new Error("Failed to check template status");

  const data = (await res.json()) as {
    data: Array<{ name: string; status: string; id: string; rejected_reason?: string }>;
  };
  return data.data?.[0] ?? null;
}

/**
 * Send a broadcast campaign to all recipients.
 */
export async function sendCampaign(campaignId: string) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status !== "approved") throw new Error("Campaign not approved");

  // Update status to sending
  await db
    .update(campaigns)
    .set({ status: "sending", updatedAt: new Date() })
    .where(eq(campaigns.id, campaignId));

  // Get recipients
  const recipients = await db
    .select()
    .from(campaignRecipients)
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.status, "pending")
      )
    );

  const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID!;
  let sentCount = 0;

  for (const recipient of recipients) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${META_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: recipient.whatsappNumber,
            type: "template",
            template: {
              name: campaign.templateName,
              language: { code: campaign.templateLanguage },
              components: campaign.templateParams?.length
                ? [
                    {
                      type: "body",
                      parameters: campaign.templateParams.map((p: string) => ({
                        type: "text",
                        text: p,
                      })),
                    },
                  ]
                : undefined,
            },
          }),
        }
      );

      if (res.ok) {
        await db
          .update(campaignRecipients)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(campaignRecipients.id, recipient.id));
        sentCount++;
      } else {
        const err = await res.json();
        await db
          .update(campaignRecipients)
          .set({ status: "failed", errorMessage: JSON.stringify(err) })
          .where(eq(campaignRecipients.id, recipient.id));
      }
    } catch (error) {
      await db
        .update(campaignRecipients)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(campaignRecipients.id, recipient.id));
    }

    // Rate limit: 80 messages/second max for WhatsApp Business API
    await new Promise((r) => setTimeout(r, 50));
  }

  await db
    .update(campaigns)
    .set({
      status: "sent",
      sentCount,
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  return { sentCount, totalRecipients: recipients.length };
}

/**
 * Populate campaign recipients based on filter criteria.
 */
export async function populateCampaignRecipients(
  campaignId: string,
  tenantId: string,
  filter?: { tags?: string[]; lastOrderDays?: number; all?: boolean }
) {
  // For now, get all customers with whatsapp numbers
  const allCustomers = await db
    .select()
    .from(customers)
    .where(eq(customers.tenantId, tenantId));

  const validCustomers = allCustomers.filter((c) => c.whatsappNumber);

  if (validCustomers.length === 0) return 0;

  const values = validCustomers.map((c) => ({
    campaignId,
    customerId: c.id,
    whatsappNumber: c.whatsappNumber,
    status: "pending" as const,
  }));

  await db.insert(campaignRecipients).values(values);

  await db
    .update(campaigns)
    .set({ totalRecipients: validCustomers.length, updatedAt: new Date() })
    .where(eq(campaigns.id, campaignId));

  return validCustomers.length;
}
