import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { verifyFirebaseIdToken } from "./utils/auth";

const PhotoAuditSchema = z.object({
  imageBase64: z.string().min(10).max(15000000), // Max ~11MB base64
  mimeType: z.string().max(32).default("image/jpeg"),
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
    const validation = PhotoAuditSchema.safeParse(rawBody);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid image payload", details: validation.error.issues }),
      };
    }

    const { imageBase64, mimeType } = validation.data;
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this image from a retail shop or provision store (shelf, stock list, receipt, or goods).
Identify each visible item, estimate count/quantity visible, and infer item details.
All counts and prices must be clearly marked as estimates for merchant review.

Return a structured JSON array of items found:
- name: clear product name
- category: one of ["Medicine & Healthcare", "Shoes & Footwear", "Clothing & Apparel", "Electronics & Accessories", "Groceries", "Bags & Luggage", "Beverages", "Snacks & Confectionery", "Grains & Staples", "Household & Cleaning", "Toiletries & Beauty", "Dairy & Cold", "Canned & Packaged", "Kiosk & Airtime", "Misc"]
- estimatedQuantity: estimated numeric quantity detected
- unit: e.g. "pcs", "can", "bottle", "pack", "carton", "bag"
- estimatedCostPrice: estimated wholesale cost price (number, or 0 if unknown)
- estimatedSellingPrice: estimated retail price (number, or 0 if unknown)
- barcode: barcode or SKU string if legible, otherwise empty string ""
- notes: brief observations`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              estimatedQuantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              estimatedCostPrice: { type: Type.NUMBER },
              estimatedSellingPrice: { type: Type.NUMBER },
              barcode: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ["name", "category", "estimatedQuantity", "unit"],
          },
        },
      },
    });

    const items = JSON.parse(response.text || "[]");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ items }),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to analyze photo with Gemini AI.";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: msg }),
    };
  }
};
