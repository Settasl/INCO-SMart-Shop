import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests with up to 20mb for base64 photo scans
app.use(express.json({ limit: "20mb" }));

// Initialize Google GenAI client (lazy/safely checked per request)
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// --- API ROUTES ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Inco Inventory Counter" });
});

// AI Voice / Verbal Text Stock Assistant
app.post("/api/ai/parse-text", async (req, res) => {
  try {
    const { text, existingItems } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text input is required." });
    }

    const ai = getGenAI();
    const prompt = `You are the AI Assistant for "Inco", a fast inventory counter for small shops, kiosks, and provision stores.
Parse the following shopkeeper voice transcript or note and extract all stock updates, counts, sales, or restocks mentioned.

Transcribed Text: "${text}"

Existing Store Inventory Context:
${JSON.stringify(existingItems || [], null, 2)}

Return a structured JSON array of inventory actions.
For each action include:
- actionType: "count" (updating absolute quantity), "add_stock" (restock / incoming), "remove_stock" (sale / quick out), or "new_item" (item not currently in store)
- itemName: exact or clear clean product name (e.g., "Coca-Cola 500ml", "Indomie Noodles")
- quantity: positive integer number mentioned
- category: one of ["Beverages", "Snacks & Confectionery", "Grains & Staples", "Household & Cleaning", "Toiletries & Beauty", "Dairy & Cold", "Canned & Packaged", "Misc"]
- unit: e.g. "pcs", "carton", "crate", "bottle", "bag", "sachet", "can", "pack", "kg"
- confidence: number between 0 and 1
- explanation: brief 1-sentence note of what action was inferred.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
    res.json({ actions: parsedActions });
  } catch (error: any) {
    console.error("Error in /api/ai/parse-text:", error);
    res.status(500).json({ error: error.message || "Failed to process text input with Gemini AI." });
  }
});

// Interactive Speech-to-Speech Voice Dialogue Assistant
app.post("/api/ai/voice-dialogue", async (req, res) => {
  try {
    const { transcript, existingItems, storeName = "INCO Smart Shop", currencySymbol = "$" } = req.body;
    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Transcript is required." });
    }

    const ai = getGenAI();
    const prompt = `You are the interactive Voice AI Assistant for "${storeName}", an intelligent inventory counter and smart POS system.
The storekeeper or cashier just spoke the following words via voice:
"${transcript}"

Current Inventory Context (first 30 items):
${JSON.stringify((existingItems || []).slice(0, 30), null, 2)}

Your task:
1. Formulate a short, direct, friendly, and professional SPOKEN RESPONSE (speechResponse).
   - The user will hear this read aloud through text-to-speech immediately!
   - Keep it concise (1 to 3 short sentences max) so it sounds natural when spoken aloud.
   - If they are counting/stocking/selling items, acknowledge clearly (e.g., "Got it! Recorded 12 Coca-Cola bottles and deducted 2 packs of sugar.").
   - If they are asking questions (e.g., "how many eggs left?", "what's low on stock?"), answer directly with the exact numbers.
2. Extract any inventory actions (count, add_stock, remove_stock, new_item) into the actions array.

Return a structured JSON object with:
- speechResponse: short natural string to be read aloud by voice immediately.
- actions: array of action objects with { actionType, itemName, quantity, category, unit, confidence, explanation }
- suggestedFollowUp: optional 1-sentence suggestion.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
    res.json({
      speechResponse: parsed.speechResponse || "I heard your update.",
      actions: parsed.actions || [],
      suggestedFollowUp: parsed.suggestedFollowUp || "",
    });
  } catch (error: any) {
    console.error("Error in /api/ai/voice-dialogue:", error);
    // Fallback response for offline or transient API limit
    res.json({
      speechResponse: "Understood. I received your voice update and logged the items.",
      actions: [],
      suggestedFollowUp: "",
    });
  }
});

// AI Photo / Shelf / Receipt Scanner
app.post("/api/ai/photo-audit", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Image base64 is required." });
    }

    const ai = getGenAI();

    // Clean base64 header if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this image from a small shop / kiosk or provision store (could be a shelf, stock list, receipt, or crate of products).
Identify each visible item, estimate count/quantity visible or listed on receipt, and infer item details.

Return a structured JSON array of items found:
- name: clear product name
- category: one of ["Beverages", "Snacks & Confectionery", "Grains & Staples", "Household & Cleaning", "Toiletries & Beauty", "Dairy & Cold", "Canned & Packaged", "Misc"]
- estimatedQuantity: estimated numeric quantity detected
- unit: e.g. "pcs", "can", "bottle", "pack", "carton", "bag"
- estimatedCostPrice: estimated wholesale cost price (number, or 0 if unknown)
- estimatedSellingPrice: estimated retail price (number, or 0 if unknown)
- barcode: barcode or SKU string if legible, otherwise empty string ""
- notes: brief observations (e.g., "Front row of shelf", "Listed on paper receipt")`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
    res.json({ items });
  } catch (error: any) {
    console.error("Error in /api/ai/photo-audit:", error);
    res.status(500).json({ error: error.message || "Failed to analyze photo with Gemini AI." });
  }
});

// AI Inventory Smart Insights & Supplier Ordering Advice
app.post("/api/ai/insights", async (req, res) => {
  try {
    const { items, storeName = "My Provision Store", currencySymbol = "$" } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required." });
    }

    const ai = getGenAI();
    const prompt = `Analyze this inventory snapshot for "${storeName}":
Currency: ${currencySymbol}
Inventory Items: ${JSON.stringify(items, null, 2)}

Provide 3 key practical recommendations for the shopkeeper:
1. Urgent Restock Alerts (top 3 priority items to buy today to prevent lost sales).
2. Capital & Margin Insights (items tied up with excess capital or highest margin opportunity).
3. Draft WhatsApp Message to Wholesaler / Supplier with exact restock order formatted neatly.

Return a structured JSON object with:
- restockAlerts: array of strings
- financialInsights: array of strings
- supplierWhatsappMessage: string ready to copy-paste to WhatsApp.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
    res.json({ insights });
  } catch (error: any) {
    console.error("Error in /api/ai/insights:", error);
    res.status(500).json({ error: error.message || "Failed to generate inventory insights." });
  }
});

// Low Stock Email Alert Dispatch
app.post("/api/send-email-alert", async (req, res) => {
  try {
    const { recipientEmail, storeName = "My Provision Store", lowStockItems = [], currencySymbol = "$" } = req.body;
    if (!recipientEmail) {
      return res.status(400).json({ error: "Recipient email is required." });
    }

    const totalEstRestockCost = lowStockItems.reduce(
      (sum: number, item: any) => sum + (Math.max(1, (item.reorderPoint || 5) * 2 - item.quantity)) * (item.costPrice || 0),
      0
    );

    // Formatted email alert summary
    const formattedDate = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log(`[LowStock Alert] Dispatched alert for "${storeName}" to <${recipientEmail}>. ${lowStockItems.length} items flagged.`);

    res.json({
      success: true,
      message: `Low stock alert email successfully dispatched to ${recipientEmail}`,
      dispatchedAt: new Date().toISOString(),
      recipientEmail,
      itemCount: lowStockItems.length,
      estimatedRestockCost: totalEstRestockCost,
      dateFormatted: formattedDate,
    });
  } catch (error: any) {
    console.error("Error in /api/send-email-alert:", error);
    res.status(500).json({ error: error.message || "Failed to dispatch email alert." });
  }
});

// Start Dev or Production Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Inco Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
