import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { verifyFirebaseIdToken } from "./utils/auth";

const InsightsSchema = z.object({
  items: z.array(z.any()),
  storeName: z.string().max(128).optional(),
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

  // Verify Firebase Authentication ID token
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const verifiedUser = await verifyFirebaseIdToken(authHeader);
  if (!verifiedUser) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unauthorized. Valid Firebase ID token required." }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server." }),
    };
  }

  try {
    const rawBody = event.body ? JSON.parse(event.body) : {};
    const validation = InsightsSchema.safeParse(rawBody);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid insights payload", details: validation.error.issues }),
      };
    }

    const { items, storeName = "My Provision Store", currencySymbol = "L$" } = validation.data;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Analyze this inventory snapshot for "${storeName}":
Currency: ${currencySymbol}
Inventory Items: ${JSON.stringify(items.slice(0, 50), null, 2)}

Provide 3 key practical recommendations for the shopkeeper based strictly on the data:
1. Urgent Restock Alerts (top priority items to reorder based on low quantities).
2. Capital and Margin Insights (items tied up with excess capital or high margin opportunity).
3. Draft WhatsApp Message to Wholesaler / Supplier with clean restock order.

Return a structured JSON object with:
- restockAlerts: array of strings
- financialInsights: array of strings
- supplierWhatsappMessage: string formatted for easy sending.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            restockAlerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            financialInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            supplierWhatsappMessage: { type: Type.STRING },
          },
          required: ["restockAlerts", "financialInsights", "supplierWhatsappMessage"],
        },
      },
    });

    const insights = JSON.parse(response.text || "{}");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ insights }),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to generate inventory insights.";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: msg }),
    };
  }
};
