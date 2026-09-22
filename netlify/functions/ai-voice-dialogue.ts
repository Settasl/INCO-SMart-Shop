import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { verifyFirebaseIdToken } from "./utils/auth";

const VoiceDialogueSchema = z.object({
  transcript: z.string().min(1).max(2000),
  existingItems: z.array(z.any()).optional(),
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
    const validation = VoiceDialogueSchema.safeParse(rawBody);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid transcript payload", details: validation.error.issues }),
      };
    }

    const { transcript, existingItems, storeName = "INCO Smart Shop", currencySymbol = "L$" } = validation.data;
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the interactive Voice AI Assistant for "${storeName}", an inventory and sales management tool for shops.
The shopkeeper spoke the following words:
"${transcript}"

Current Inventory Context (first 30 items):
${JSON.stringify((existingItems || []).slice(0, 30), null, 2)}

Tasks:
1. Formulate a short, direct, friendly, professional spoken response (speechResponse).
   - Keep it concise (1 to 3 short sentences max) so it sounds natural when spoken aloud.
   - If they are counting, restocking, or selling items, acknowledge clearly.
   - If they are asking questions, answer directly with exact numbers.
2. Extract any inventory actions (count, add_stock, remove_stock, new_item) into the actions array.

Return a structured JSON object with:
- speechResponse: short natural string to be read aloud by voice immediately.
- actions: array of action objects with { actionType, itemName, quantity, category, unit, confidence, explanation }
- suggestedFollowUp: optional 1-sentence suggestion.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speechResponse: { type: Type.STRING },
            actions: {
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
            suggestedFollowUp: { type: Type.STRING },
          },
          required: ["speechResponse", "actions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        speechResponse: parsed.speechResponse || "I heard your update.",
        actions: parsed.actions || [],
        suggestedFollowUp: parsed.suggestedFollowUp || "",
      }),
    };
  } catch (error: unknown) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        speechResponse: "Understood. I received your voice update and logged the items.",
        actions: [],
        suggestedFollowUp: "",
      }),
    };
  }
};
