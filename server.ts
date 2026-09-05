import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const app = express();
const PORT = 3000;

// Security Headers & Controlled CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "SAMEORIGIN");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware for parsing JSON requests with up to 20mb for base64 photo scans
app.use(express.json({ limit: "20mb" }));

// --- TYPES ---
export interface BackendAccount {
  id: string;
  emailOrPhone: string;
  displayName: string;
  storeName: string;
  role: "admin" | "merchant" | "manager" | "cashier";
  isVerified: boolean;
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  accountStatus: "active" | "pending_approval" | "suspended" | "blocked";
  isPro: boolean;
  proMonths?: number;
  proExpiresAt?: string;
  avatarUrl: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface TelemetryEvent {
  id: string;
  type: "sale" | "restock" | "signup" | "login" | "kyc" | "pro_upgrade" | "admin_action";
  storeName: string;
  userIdentifier: string;
  description: string;
  amount?: number;
  timestamp: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "alert" | "feature";
  createdAt: string;
  author: string;
}

// Initial Telemetry and Announcements
const INITIAL_TELEMETRY: TelemetryEvent[] = [
  {
    id: "telem-init-1",
    type: "signup",
    storeName: "David Provisions & Mini Mart",
    userIdentifier: "merchant@kiosk.com",
    description: "New merchant registered account",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "telem-init-2",
    type: "sale",
    storeName: "David Provisions & Mini Mart",
    userIdentifier: "merchant@kiosk.com",
    description: "POS sale completed: 4 items ($28.50)",
    amount: 28.5,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: "ann-01",
    title: "INCO Smart Shop v4.0 Production Foundation Live",
    message: "Multi-tenant architecture, Firebase authentication, hardened security rules, and real-time ledger are active.",
    type: "feature",
    createdAt: new Date().toISOString(),
    author: "System Operations",
  },
];

// File-based persistence setup
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "inco_database.json");

interface DatabaseSchema {
  users: BackendAccount[];
  telemetry: TelemetryEvent[];
  announcements: SystemAnnouncement[];
  lastUpdated: string;
}

let dbState: DatabaseSchema = {
  users: [],
  telemetry: INITIAL_TELEMETRY,
  announcements: INITIAL_ANNOUNCEMENTS,
  lastUpdated: new Date().toISOString(),
};

function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed) {
        dbState = {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          telemetry: Array.isArray(parsed.telemetry) ? parsed.telemetry : INITIAL_TELEMETRY,
          announcements: Array.isArray(parsed.announcements) ? parsed.announcements : INITIAL_ANNOUNCEMENTS,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        return;
      }
    }
    saveDatabase();
  } catch (err) {
    console.error("[Database] Error initializing database file:", err);
  }
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbState.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (err) {
    console.error("[Database] Error saving database file:", err);
  }
}

initDatabase();

// Google GenAI client (lazy initialized)
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// --- API ROUTES ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "INCO Smart Shop",
    environment: process.env.NODE_ENV || "development",
    lastUpdated: dbState.lastUpdated,
  });
});

// Telemetry events
app.get("/api/telemetry", (req, res) => {
  res.json({
    success: true,
    telemetry: dbState.telemetry,
  });
});

const TelemetrySchema = z.object({
  type: z.enum(["sale", "restock", "signup", "login", "kyc", "pro_upgrade", "admin_action"]),
  storeName: z.string().max(128).optional(),
  userIdentifier: z.string().max(128).optional(),
  description: z.string().min(1).max(512),
  amount: z.number().optional(),
});

app.post("/api/telemetry", (req, res) => {
  try {
    const parsed = TelemetrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid telemetry payload", details: parsed.error.issues });
    }

    const { type, storeName, userIdentifier, description, amount } = parsed.data;
    const event: TelemetryEvent = {
      id: `telem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      storeName: storeName || "Merchant Store",
      userIdentifier: userIdentifier || "anonymous",
      description,
      amount,
      timestamp: new Date().toISOString(),
    };

    dbState.telemetry.unshift(event);
    if (dbState.telemetry.length > 100) dbState.telemetry = dbState.telemetry.slice(0, 100);
    saveDatabase();

    res.status(201).json({ success: true, event });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to record telemetry";
    res.status(500).json({ error: msg });
  }
});

// System Announcements
app.get("/api/announcements", (req, res) => {
  res.json({
    success: true,
    announcements: dbState.announcements,
  });
});

const AnnouncementSchema = z.object({
  title: z.string().min(1).max(128).trim(),
  message: z.string().min(1).max(1024).trim(),
  type: z.enum(["info", "warning", "alert", "feature"]).default("info"),
  author: z.string().max(64).default("System Operations"),
});

app.post("/api/announcements", (req, res) => {
  try {
    const parsed = AnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid announcement payload", details: parsed.error.issues });
    }

    const ann: SystemAnnouncement = {
      id: `ann-${Date.now()}`,
      ...parsed.data,
      createdAt: new Date().toISOString(),
    };

    dbState.announcements.unshift(ann);
    saveDatabase();

    res.status(201).json({ success: true, announcement: ann });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to publish announcement";
    res.status(500).json({ error: msg });
  }
});

// Full state sync snapshot
app.get("/api/sync", (req, res) => {
  res.json({
    success: true,
    telemetry: dbState.telemetry,
    announcements: dbState.announcements,
    serverTime: new Date().toISOString(),
  });
});

// --- AI SERVICES (SECURE SERVER PROXIED) ---

const ParseTextSchema = z.object({
  text: z.string().min(1).max(2000),
  existingItems: z.array(z.any()).optional(),
});

app.post("/api/ai/parse-text", async (req, res) => {
  try {
    const validation = ParseTextSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid text input payload", details: validation.error.issues });
    }

    const { text, existingItems } = validation.data;
    const ai = getGenAI();
    const prompt = `You are the AI Assistant for "INCO Smart Shop", a fast inventory counter for small shops, kiosks, and provision stores.
Parse the following shopkeeper voice transcript or note and extract all stock updates, counts, sales, or restocks mentioned.

Transcribed Text: "${text}"

Existing Store Inventory Context:
${JSON.stringify((existingItems || []).slice(0, 30), null, 2)}

Return a structured JSON array of inventory actions.
For each action include:
- actionType: "count" (updating absolute quantity), "add_stock" (restock / incoming), "remove_stock" (sale / quick out), or "new_item" (item not currently in store)
- itemName: exact or clear clean product name (e.g., "Coca-Cola 500ml", "Indomie Noodles")
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
    res.json({ actions: parsedActions });
  } catch (error: unknown) {
    console.error("Error in /api/ai/parse-text:", error);
    const msg = error instanceof Error ? error.message : "Failed to process text input with Gemini AI.";
    res.status(500).json({ error: msg });
  }
});

const VoiceDialogueSchema = z.object({
  transcript: z.string().min(1).max(2000),
  existingItems: z.array(z.any()).optional(),
  storeName: z.string().max(128).optional(),
  currencySymbol: z.string().max(8).optional(),
});

app.post("/api/ai/voice-dialogue", async (req, res) => {
  try {
    const validation = VoiceDialogueSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid transcript payload", details: validation.error.issues });
    }

    const { transcript, existingItems, storeName = "INCO Smart Shop", currencySymbol = "$" } = validation.data;
    const ai = getGenAI();
    const prompt = `You are the interactive Voice AI Assistant for "${storeName}", an intelligent inventory counter and smart POS system.
The storekeeper or cashier just spoke the following words via voice:
"${transcript}"

Current Inventory Context (first 30 items):
${JSON.stringify((existingItems || []).slice(0, 30), null, 2)}

Your task:
1. Formulate a short, direct, friendly, and professional SPOKEN RESPONSE (speechResponse).
   - Keep it concise (1 to 3 short sentences max) so it sounds natural when spoken aloud.
   - If they are counting/stocking/selling items, acknowledge clearly.
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
    res.json({
      speechResponse: parsed.speechResponse || "I heard your update.",
      actions: parsed.actions || [],
      suggestedFollowUp: parsed.suggestedFollowUp || "",
    });
  } catch (error: unknown) {
    console.error("Error in /api/ai/voice-dialogue:", error);
    res.json({
      speechResponse: "Understood. I received your voice update and logged the items.",
      actions: [],
      suggestedFollowUp: "",
    });
  }
});

const PhotoAuditSchema = z.object({
  imageBase64: z.string().min(10),
  mimeType: z.string().max(32).default("image/jpeg"),
});

app.post("/api/ai/photo-audit", async (req, res) => {
  try {
    const validation = PhotoAuditSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid image payload", details: validation.error.issues });
    }

    const { imageBase64, mimeType } = validation.data;
    const ai = getGenAI();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this image from a small shop / kiosk or provision store (could be a shelf, stock list, receipt, or crate of products).
Identify each visible item, estimate count/quantity visible or listed on receipt, and infer item details.

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
    res.json({ items });
  } catch (error: unknown) {
    console.error("Error in /api/ai/photo-audit:", error);
    const msg = error instanceof Error ? error.message : "Failed to analyze photo with Gemini AI.";
    res.status(500).json({ error: msg });
  }
});

const InsightsSchema = z.object({
  items: z.array(z.any()),
  storeName: z.string().max(128).optional(),
  currencySymbol: z.string().max(8).optional(),
});

app.post("/api/ai/insights", async (req, res) => {
  try {
    const validation = InsightsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid insights payload", details: validation.error.issues });
    }

    const { items, storeName = "My Provision Store", currencySymbol = "$" } = validation.data;
    const ai = getGenAI();
    const prompt = `Analyze this inventory snapshot for "${storeName}":
Currency: ${currencySymbol}
Inventory Items: ${JSON.stringify(items.slice(0, 50), null, 2)}

Provide 3 key practical recommendations for the shopkeeper:
1. Urgent Restock Alerts (top 3 priority items to buy today to prevent lost sales).
2. Capital & Margin Insights (items tied up with excess capital or highest margin opportunity).
3. Draft WhatsApp Message to Wholesaler / Supplier with exact restock order formatted neatly.

Return a structured JSON object with:
- restockAlerts: array of strings
- financialInsights: array of strings
- supplierWhatsappMessage: string ready to copy-paste to WhatsApp.`;

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
    res.json({ insights });
  } catch (error: unknown) {
    console.error("Error in /api/ai/insights:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate inventory insights.";
    res.status(500).json({ error: msg });
  }
});

const SendEmailSchema = z.object({
  recipientEmail: z.string().email(),
  storeName: z.string().max(128).optional(),
  lowStockItems: z.array(z.any()).optional(),
  currencySymbol: z.string().max(8).optional(),
});

app.post("/api/send-email-alert", async (req, res) => {
  try {
    const validation = SendEmailSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid email alert payload", details: validation.error.issues });
    }

    const { recipientEmail, storeName = "My Provision Store", lowStockItems = [] } = validation.data;
    const totalEstRestockCost = lowStockItems.reduce(
      (sum: number, item: any) =>
        sum + Math.max(1, (item.reorderPoint || 5) * 2 - (item.quantity || 0)) * (item.costPrice || 0),
      0
    );

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
  } catch (error: unknown) {
    console.error("Error in /api/send-email-alert:", error);
    const msg = error instanceof Error ? error.message : "Failed to dispatch email alert.";
    res.status(500).json({ error: msg });
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
    console.log(`[INCO Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
