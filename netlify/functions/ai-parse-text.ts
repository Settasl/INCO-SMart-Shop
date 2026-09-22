import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { verifyFirebaseIdToken } from "./utils/auth";

const ParseTextSchema = z.object({
  text: z.string().min(1).max(2000),
  existingItems: z.array(z.any()).optional(),
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
    const validation = ParseTextSchema.safeParse(rawBody);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid text input payload", details: validation.error.issues }),
      };
    }

    const { text, existingItems } = validation.data;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the AI Assistant for "INCO Smart Shop", an inventory and sales tracking system for small shops and provision stores.
Parse the following shopkeeper voice transcript or note and extract all stock updates, counts, sales, or restocks mentioned.

Transcribed Text: "${text}"

Existing Store Inventory Context:
${JSON.stringify((existingItems || []).slice(0, 30), null, 2)}

Return a structured JSON array of inventory actions.
For each action include:
- actionType: "count" (updating absolute quantity), "add_stock" (restock / incoming), "remove_stock" (sale / quick out), or "new_item" (item not currently in store)
- itemName: exact or clean product name (e.g., "Coca-Cola 500ml", "Indomie Noodles")
- quantity: positive integer number mentioned
- category: one of ["Medicine & Healthcare", "Shoes & Footwear", "Clothing & Apparel", "Electronics & Accessories", "Groceries", "Bags & Luggage", "Beverages", "Snacks & Confectionery", "Grains & Staples", "Household & Cleaning", "Toiletries & Beauty", "Dairy & Cold", "Canned & Packaged", "Kiosk & Airtime", "Misc"]
- unit: e.g. "pcs", "carton", "crate", "bottle", "bag", "sachet", "can", "pack", "kg", "box"
- confidence: number between 0 and 1
- explanation: brief 1-sentence note of what action was inferred.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              actionType: { type: Type.STRING },
              itemName: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              category: { type: Type.STRING },
              unit: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
            },
            required: ["actionType", "itemName", "quantity", "category", "unit"],
          },
        },
      },
    });

    const parsedActions = JSON.parse(response.text || "[]");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ actions: parsedActions }),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to process text input with Gemini AI.";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: msg }),
    };
  }
};
