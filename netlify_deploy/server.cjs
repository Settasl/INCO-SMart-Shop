var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_zod = require("zod");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
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
app.use(import_express.default.json({ limit: "20mb" }));
var INITIAL_TELEMETRY = [];
var INITIAL_ANNOUNCEMENTS = [];
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "inco_database.json");
var dbState = {
  users: [],
  telemetry: INITIAL_TELEMETRY,
  announcements: INITIAL_ANNOUNCEMENTS,
  lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
};
var DEFAULT_SERVER_USERS = [
  {
    id: "user-super-admin-01",
    emailOrPhone: "settaholdings@gmail.com",
    displayName: "INCO Master Admin",
    storeName: "INCO Headquarters",
    role: "admin",
    isVerified: true,
    verificationStatus: "approved",
    accountStatus: "active",
    isPro: true,
    proExpiresAt: new Date(Date.now() + 1e3 * 60 * 60 * 24 * 3650).toISOString(),
    avatarUrl: "",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];
function initDatabase() {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (import_fs.default.existsSync(DB_FILE)) {
      const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed) {
        let loadedUsers = Array.isArray(parsed.users) ? parsed.users : [];
        if (loadedUsers.length === 0) {
          loadedUsers = [...DEFAULT_SERVER_USERS];
        }
        dbState = {
          users: loadedUsers,
          telemetry: Array.isArray(parsed.telemetry) ? parsed.telemetry : INITIAL_TELEMETRY,
          announcements: Array.isArray(parsed.announcements) ? parsed.announcements : INITIAL_ANNOUNCEMENTS,
          lastUpdated: parsed.lastUpdated || (/* @__PURE__ */ new Date()).toISOString()
        };
        return;
      }
    }
    dbState.users = [...DEFAULT_SERVER_USERS];
    saveDatabase();
  } catch (err) {
    console.error("[Database] Error initializing database file:", err);
  }
}
function saveDatabase() {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbState.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (err) {
    console.error("[Database] Error saving database file:", err);
  }
}
initDatabase();
var genAIClient = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  if (!genAIClient) {
    genAIClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAIClient;
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "INCO Smart Shop",
    environment: process.env.NODE_ENV || "development",
    lastUpdated: dbState.lastUpdated
  });
});
app.get("/api/telemetry", (req, res) => {
  res.json({
    success: true,
    telemetry: dbState.telemetry
  });
});
var TelemetrySchema = import_zod.z.object({
  type: import_zod.z.enum(["sale", "restock", "signup", "login", "kyc", "pro_upgrade", "admin_action"]),
  storeName: import_zod.z.string().max(128).optional(),
  userIdentifier: import_zod.z.string().max(128).optional(),
  description: import_zod.z.string().min(1).max(512),
  amount: import_zod.z.number().optional()
});
app.post("/api/telemetry", (req, res) => {
  try {
    const parsed = TelemetrySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid telemetry payload", details: parsed.error.issues });
    }
    const { type, storeName, userIdentifier, description, amount } = parsed.data;
    const event = {
      id: `telem-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      type,
      storeName: storeName || "Merchant Store",
      userIdentifier: userIdentifier || "anonymous",
      description,
      amount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbState.telemetry.unshift(event);
    if (dbState.telemetry.length > 100) dbState.telemetry = dbState.telemetry.slice(0, 100);
    saveDatabase();
    res.status(201).json({ success: true, event });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to record telemetry";
    res.status(500).json({ error: msg });
  }
});
app.get("/api/announcements", (req, res) => {
  res.json({
    success: true,
    announcements: dbState.announcements
  });
});
var AnnouncementSchema = import_zod.z.object({
  title: import_zod.z.string().min(1).max(128).trim(),
  message: import_zod.z.string().min(1).max(1024).trim(),
  type: import_zod.z.enum(["info", "warning", "alert", "feature"]).default("info"),
  author: import_zod.z.string().max(64).default("System Operations")
});
app.post("/api/announcements", (req, res) => {
  try {
    const parsed = AnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid announcement payload", details: parsed.error.issues });
    }
    const ann = {
      id: `ann-${Date.now()}`,
      ...parsed.data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbState.announcements.unshift(ann);
    saveDatabase();
    res.status(201).json({ success: true, announcement: ann });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to publish announcement";
    res.status(500).json({ error: msg });
  }
});
app.get("/api/sync", (req, res) => {
  res.json({
    success: true,
    users: dbState.users,
    telemetry: dbState.telemetry,
    announcements: dbState.announcements,
    serverTime: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/users", (req, res) => {
  res.json({
    success: true,
    users: dbState.users,
    total: dbState.users.length,
    lastUpdated: dbState.lastUpdated
  });
});
var UserSignupSchema = import_zod.z.object({
  emailOrPhone: import_zod.z.string().min(3).max(128).trim(),
  password: import_zod.z.string().min(6).optional(),
  displayName: import_zod.z.string().max(128).optional(),
  storeName: import_zod.z.string().max(128).optional(),
  role: import_zod.z.enum(["admin", "merchant", "manager", "cashier"]).optional(),
  avatarUrl: import_zod.z.string().optional()
});
app.post("/api/users/signup", (req, res) => {
  try {
    const parsed = UserSignupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid user registration data", details: parsed.error.issues });
    }
    const { emailOrPhone, displayName, storeName, role, avatarUrl } = parsed.data;
    const cleanId = emailOrPhone.trim().toLowerCase();
    const existing = dbState.users.find(
      (u) => u.emailOrPhone.toLowerCase() === cleanId || u.id.toLowerCase() === cleanId
    );
    if (existing) {
      return res.status(409).json({ error: "An account with this email/phone already exists. Please sign in.", user: existing });
    }
    const isDefaultAdmin = cleanId === "settaholdings@gmail.com";
    const newUser = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      emailOrPhone: cleanId,
      displayName: displayName?.trim() || (cleanId.includes("@") ? cleanId.split("@")[0].charAt(0).toUpperCase() + cleanId.split("@")[0].slice(1) : `Merchant ${cleanId.slice(-4)}`),
      storeName: storeName?.trim() || "My Store",
      role: isDefaultAdmin ? "admin" : role || "merchant",
      isVerified: true,
      verificationStatus: "approved",
      accountStatus: "active",
      isPro: isDefaultAdmin,
      avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastLoginAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbState.users = [newUser, ...dbState.users.filter((u) => u.id !== newUser.id)];
    const signupEvent = {
      id: `telem-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      type: "signup",
      storeName: newUser.storeName,
      userIdentifier: newUser.emailOrPhone,
      description: `New store registered: ${newUser.displayName} (${newUser.storeName})`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbState.telemetry.unshift(signupEvent);
    if (dbState.telemetry.length > 100) dbState.telemetry = dbState.telemetry.slice(0, 100);
    saveDatabase();
    console.log(`[Users] New user registered on platform: ${newUser.emailOrPhone} (${newUser.displayName})`);
    res.status(201).json({
      success: true,
      user: newUser,
      message: "Account registered successfully and synchronized with admin backend."
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to register user";
    res.status(500).json({ error: msg });
  }
});
app.post("/api/users/sync", (req, res) => {
  try {
    const clientUsers = Array.isArray(req.body.clientUsers) ? req.body.clientUsers : [];
    const map = /* @__PURE__ */ new Map();
    for (const u of dbState.users) {
      map.set(u.emailOrPhone.toLowerCase(), u);
    }
    for (const cu of clientUsers) {
      if (cu && cu.emailOrPhone) {
        const key = cu.emailOrPhone.toLowerCase();
        if (!map.has(key)) {
          const newBackendUser = {
            id: cu.id || `user-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
            emailOrPhone: key,
            displayName: cu.displayName || key.split("@")[0],
            storeName: cu.storeName || "My Store",
            role: key === "settaholdings@gmail.com" ? "admin" : cu.role || "merchant",
            isVerified: cu.isVerified ?? true,
            verificationStatus: cu.verificationStatus || "approved",
            accountStatus: cu.accountStatus || "active",
            isPro: cu.isPro || key === "settaholdings@gmail.com",
            avatarUrl: cu.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
            createdAt: cu.createdAt || (/* @__PURE__ */ new Date()).toISOString()
          };
          map.set(key, newBackendUser);
        }
      }
    }
    if (!map.has("settaholdings@gmail.com")) {
      map.set("settaholdings@gmail.com", DEFAULT_SERVER_USERS[0]);
    }
    dbState.users = Array.from(map.values());
    saveDatabase();
    res.json({
      success: true,
      users: dbState.users,
      total: dbState.users.length
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to sync users";
    res.status(500).json({ error: msg });
  }
});
app.put("/api/users/:id", (req, res) => {
  try {
    const target = decodeURIComponent(req.params.id).toLowerCase();
    const idx = dbState.users.findIndex(
      (u) => u.id.toLowerCase() === target || u.emailOrPhone.toLowerCase() === target
    );
    if (idx === -1) {
      return res.status(404).json({ error: "User not found" });
    }
    dbState.users[idx] = {
      ...dbState.users[idx],
      ...req.body
    };
    saveDatabase();
    res.json({ success: true, user: dbState.users[idx] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update user";
    res.status(500).json({ error: msg });
  }
});
app.delete("/api/users/:id", (req, res) => {
  try {
    const target = decodeURIComponent(req.params.id).toLowerCase();
    if (target === "settaholdings@gmail.com" || target === "user-super-admin-01") {
      return res.status(403).json({ error: "Cannot delete master administrator account." });
    }
    dbState.users = dbState.users.filter(
      (u) => u.id.toLowerCase() !== target && u.emailOrPhone.toLowerCase() !== target
    );
    saveDatabase();
    res.json({ success: true, message: "User account deleted." });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete user";
    res.status(500).json({ error: msg });
  }
});
var ParseTextSchema = import_zod.z.object({
  text: import_zod.z.string().min(1).max(2e3),
  existingItems: import_zod.z.array(import_zod.z.any()).optional()
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
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              actionType: { type: import_genai.Type.STRING },
              itemName: { type: import_genai.Type.STRING },
              quantity: { type: import_genai.Type.NUMBER },
              category: { type: import_genai.Type.STRING },
              unit: { type: import_genai.Type.STRING },
              confidence: { type: import_genai.Type.NUMBER },
              explanation: { type: import_genai.Type.STRING }
            },
            required: ["actionType", "itemName", "quantity", "category", "unit"]
          }
        }
      }
    });
    const parsedActions = JSON.parse(response.text || "[]");
    res.json({ actions: parsedActions });
  } catch (error) {
    console.error("Error in /api/ai/parse-text:", error);
    const msg = error instanceof Error ? error.message : "Failed to process text input with Gemini AI.";
    res.status(500).json({ error: msg });
  }
});
var VoiceDialogueSchema = import_zod.z.object({
  transcript: import_zod.z.string().min(1).max(2e3),
  existingItems: import_zod.z.array(import_zod.z.any()).optional(),
  storeName: import_zod.z.string().max(128).optional(),
  currencySymbol: import_zod.z.string().max(8).optional()
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
          type: import_genai.Type.OBJECT,
          properties: {
            speechResponse: { type: import_genai.Type.STRING },
            actions: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  actionType: { type: import_genai.Type.STRING },
                  itemName: { type: import_genai.Type.STRING },
                  quantity: { type: import_genai.Type.NUMBER },
                  category: { type: import_genai.Type.STRING },
                  unit: { type: import_genai.Type.STRING },
                  confidence: { type: import_genai.Type.NUMBER },
                  explanation: { type: import_genai.Type.STRING }
                },
                required: ["actionType", "itemName", "quantity", "category", "unit"]
              }
            },
            suggestedFollowUp: { type: import_genai.Type.STRING }
          },
          required: ["speechResponse", "actions"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    res.json({
      speechResponse: parsed.speechResponse || "I heard your update.",
      actions: parsed.actions || [],
      suggestedFollowUp: parsed.suggestedFollowUp || ""
    });
  } catch (error) {
    console.error("Error in /api/ai/voice-dialogue:", error);
    res.json({
      speechResponse: "Understood. I received your voice update and logged the items.",
      actions: [],
      suggestedFollowUp: ""
    });
  }
});
var PhotoAuditSchema = import_zod.z.object({
  imageBase64: import_zod.z.string().min(10),
  mimeType: import_zod.z.string().max(32).default("image/jpeg")
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
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              name: { type: import_genai.Type.STRING },
              category: { type: import_genai.Type.STRING },
              estimatedQuantity: { type: import_genai.Type.NUMBER },
              unit: { type: import_genai.Type.STRING },
              estimatedCostPrice: { type: import_genai.Type.NUMBER },
              estimatedSellingPrice: { type: import_genai.Type.NUMBER },
              barcode: { type: import_genai.Type.STRING },
              notes: { type: import_genai.Type.STRING }
            },
            required: ["name", "category", "estimatedQuantity", "unit"]
          }
        }
      }
    });
    const items = JSON.parse(response.text || "[]");
    res.json({ items });
  } catch (error) {
    console.error("Error in /api/ai/photo-audit:", error);
    const msg = error instanceof Error ? error.message : "Failed to analyze photo with Gemini AI.";
    res.status(500).json({ error: msg });
  }
});
var InsightsSchema = import_zod.z.object({
  items: import_zod.z.array(import_zod.z.any()),
  storeName: import_zod.z.string().max(128).optional(),
  currencySymbol: import_zod.z.string().max(8).optional()
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
          type: import_genai.Type.OBJECT,
          properties: {
            restockAlerts: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            },
            financialInsights: {
              type: import_genai.Type.ARRAY,
              items: { type: import_genai.Type.STRING }
            },
            supplierWhatsappMessage: { type: import_genai.Type.STRING }
          },
          required: ["restockAlerts", "financialInsights", "supplierWhatsappMessage"]
        }
      }
    });
    const insights = JSON.parse(response.text || "{}");
    res.json({ insights });
  } catch (error) {
    console.error("Error in /api/ai/insights:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate inventory insights.";
    res.status(500).json({ error: msg });
  }
});
var SendEmailSchema = import_zod.z.object({
  recipientEmail: import_zod.z.string().email(),
  storeName: import_zod.z.string().max(128).optional(),
  lowStockItems: import_zod.z.array(import_zod.z.any()).optional(),
  currencySymbol: import_zod.z.string().max(8).optional()
});
app.post("/api/send-email-alert", async (req, res) => {
  try {
    const validation = SendEmailSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid email alert payload", details: validation.error.issues });
    }
    const { recipientEmail, storeName = "INCO Store", lowStockItems = [], currencySymbol = "$" } = validation.data;
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const brevoApiKey = process.env.BREVO_API_KEY;
    const postmarkApiKey = process.env.POSTMARK_SERVER_TOKEN;
    const senderEmail = process.env.EMAIL_FROM || "INCO Store <alerts@foirosi.resend.app>";
    if (!resendApiKey && !sendgridApiKey && !brevoApiKey && !postmarkApiKey) {
      return res.status(503).json({
        error: "Transactional email provider is not configured. Set RESEND_API_KEY in your environment variables to enable live delivery.",
        providerConfigured: false
      });
    }
    const emailSubject = `[INCO Alert] Low Stock Summary for ${storeName} (${lowStockItems.length} items flagged)`;
    const itemListHtml = (lowStockItems || []).map(
      (item) => `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.name || "Item"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #dc2626;">${item.quantity ?? 0} ${item.unit || "pcs"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.reorderPoint ?? 5}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${currencySymbol}${(item.costPrice || 0).toFixed(2)}</td>
          </tr>`
    ).join("");
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
    if (resendApiKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [recipientEmail],
          subject: emailSubject,
          html: emailHtml
        })
      });
      if (!resendRes.ok) {
        const errorText = await resendRes.text();
        return res.status(502).json({
          error: "Resend email dispatch error",
          details: errorText
        });
      }
      const resendJson = await resendRes.json();
      return res.json({
        success: true,
        provider: "resend",
        messageId: resendJson.id,
        recipientEmail,
        itemCount: lowStockItems.length,
        dispatchedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (sendgridApiKey) {
      const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipientEmail }] }],
          from: { email: senderEmail },
          subject: emailSubject,
          content: [{ type: "text/html", value: emailHtml }]
        })
      });
      if (!sgRes.ok) {
        const errorText = await sgRes.text();
        return res.status(502).json({
          error: "SendGrid email dispatch error",
          details: errorText
        });
      }
      return res.json({
        success: true,
        provider: "sendgrid",
        recipientEmail,
        itemCount: lowStockItems.length,
        dispatchedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    if (brevoApiKey) {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender: { email: senderEmail, name: storeName },
          to: [{ email: recipientEmail }],
          subject: emailSubject,
          htmlContent: emailHtml
        })
      });
      if (!brevoRes.ok) {
        const errorText = await brevoRes.text();
        return res.status(502).json({
          error: "Brevo email dispatch error",
          details: errorText
        });
      }
      return res.json({
        success: true,
        provider: "brevo",
        recipientEmail,
        itemCount: lowStockItems.length,
        dispatchedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  } catch (error) {
    console.error("Error in /api/send-email-alert:", error);
    const msg = error instanceof Error ? error.message : "Failed to dispatch email alert.";
    res.status(500).json({ error: msg });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[INCO Server] Running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
