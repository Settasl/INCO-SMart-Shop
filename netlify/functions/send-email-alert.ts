import { z } from "zod";
import { verifyFirebaseIdToken } from "./utils/auth";

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const SendEmailSchema = z.object({
  recipientEmail: z.string().email(),
  storeName: z.string().max(128).optional(),
  lowStockItems: z.array(z.any()).optional(),
  currencySymbol: z.string().max(8).optional(),
});

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  // Verify Firebase ID Token
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const verifiedUser = await verifyFirebaseIdToken(authHeader);
  if (!verifiedUser) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unauthorized. Valid Firebase ID token required." }),
    };
  }

  try {
    const rawBody = event.body ? JSON.parse(event.body) : {};
    const validation = SendEmailSchema.safeParse(rawBody);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid email alert payload", details: validation.error.issues }),
      };
    }

    const { recipientEmail, storeName = "INCO Store", lowStockItems = [], currencySymbol = "L$" } = validation.data;
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const senderEmail = process.env.EMAIL_FROM || "INCO Store <alerts@foirosi.resend.app>";

    const safeStoreName = escapeHtml(storeName);
    const safeCurrency = escapeHtml(currencySymbol);

    const itemListHtml = (lowStockItems || [])
      .map(
        (item: any) =>
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(item.name || "Item")}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #dc2626;">${Number(item.quantity) || 0} ${escapeHtml(item.unit || "pcs")}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${Number(item.reorderPoint) || 5}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${safeCurrency}${(Number(item.costPrice) || 0).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const emailSubject = `[INCO Alert] Low Stock Summary for ${storeName} (${lowStockItems.length} items flagged)`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #fbbf24; margin: 0;">INCO Smart Shop</h2>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 14px;">Urgent Stock Restock Alert</p>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hello,</p>
          <p>This is an automated inventory alert for <strong>${storeName}</strong>. The following <strong>${lowStockItems.length}</strong> items have fallen below their configured reorder thresholds:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8fafc; text-align: left;">
                <th style="padding: 8px; border-bottom: 2px solid #e2e8f0;">Product</th>
                <th style="padding: 8px; border-bottom: 2px solid #e2e8f0;">Current Stock</th>
                <th style="padding: 8px; border-bottom: 2px solid #e2e8f0;">Reorder Point</th>
                <th style="padding: 8px; border-bottom: 2px solid #e2e8f0;">Unit Cost</th>
              </tr>
            </thead>
            <tbody>
              ${itemListHtml}
            </tbody>
          </table>
          <p style="font-size: 13px; color: #64748b;">Please restock these items soon to prevent stockouts and missed customer sales.</p>
        </div>
      </div>
    `;

    // 1. Try Resend if configured
    if (resendApiKey) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [recipientEmail],
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const errBody = await resendResponse.text();
        return {
          statusCode: 502,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Resend email delivery failed. Check API key and verified domain.",
            details: errBody,
          }),
        };
      }

      const resendData = await resendResponse.json();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: true,
          provider: "resend",
          messageId: resendData.id,
          recipientEmail,
          itemCount: lowStockItems.length,
          dispatchedAt: new Date().toISOString(),
        }),
      };
    }

    // 2. Try SendGrid if configured
    if (sendgridApiKey) {
      const sendgridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipientEmail }] }],
          from: { email: senderEmail },
          subject: emailSubject,
          content: [{ type: "text/html", value: emailHtml }],
        }),
      });

      if (!sendgridResponse.ok) {
        const errBody = await sendgridResponse.text();
        return {
          statusCode: 502,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "SendGrid email delivery failed. Check API key and sender identity.",
            details: errBody,
          }),
        };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: true,
          provider: "sendgrid",
          recipientEmail,
          itemCount: lowStockItems.length,
          dispatchedAt: new Date().toISOString(),
        }),
      };
    }

    // 3. No email provider configured - do NOT fake success!
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Transactional email provider is not configured. Set RESEND_API_KEY or SENDGRID_API_KEY in your environment variables to enable email delivery.",
        providerConfigured: false,
      }),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to process email dispatch.";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: msg }),
    };
  }
};
