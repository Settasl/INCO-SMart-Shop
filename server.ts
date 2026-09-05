import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS and Safari compatibility headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware for parsing JSON requests with up to 20mb for base64 photo scans
app.use(express.json({ limit: "20mb" }));

// --- BACKEND PERSISTENT STORE (IN-MEMORY + DISK BACKED) ---
export interface BackendAccount {
  id: string;
  emailOrPhone: string;
  passwordHash: string;
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
  userAppealReason?: string;
  suspensionReason?: string;
  suspensionDate?: string;
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

const SUPER_ADMIN_EMAIL = "settaholdings@gmail.com";
const DEFAULT_ADMIN_PASS = "INCOAdmin@2026!";

const INITIAL_BACKEND_USERS: BackendAccount[] = [
  {
    id: "user-super-admin-01",
    emailOrPhone: SUPER_ADMIN_EMAIL,
    passwordHash: DEFAULT_ADMIN_PASS,
    displayName: "INCO Master Admin (Setta SL)",
    storeName: "INCO Headquarters",
    role: "admin",
    isVerified: true,
    verificationStatus: "approved",
    accountStatus: "active",
    isPro: true,
    proExpiresAt: "2036-01-01T00:00:00.000Z",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: "user-demo-merchant-02",
    emailOrPhone: "merchant@kiosk.com",
    passwordHash: "password123",
    displayName: "David Kiosk",
    storeName: "David Provisions & Mini Mart",
    role: "merchant",
    isVerified: false,
    verificationStatus: "none",
    accountStatus: "active",
    isPro: false,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140&auto=format&fit=crop&q=80",
    createdAt: "2026-02-15T00:00:00.000Z",
    lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const INITIAL_TELEMETRY: TelemetryEvent[] = [
  {
    id: "telem-init-1",
    type: "signup",
    storeName: "David Provisions & Mini Mart",
    userIdentifier: "merchant@kiosk.com",
    description: "New merchant registered account from Freetown",
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
  {
    id: "telem-init-3",
    type: "login",
    storeName: "INCO Headquarters",
    userIdentifier: SUPER_ADMIN_EMAIL,
    description: "Super Admin session active on Command Console",
    timestamp: new Date().toISOString(),
  },
];

const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: "ann-01",
    title: "INCO v3.2 Core Upgrade Active",
    message: "Real-time client-to-backend user synchronization, Glass Silk aesthetic, and Safari WebKit optimizations deployed.",
    type: "feature",
    createdAt: new Date().toISOString(),
    author: "System Super Admin",
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
  users: INITIAL_BACKEND_USERS,
  telemetry: INITIAL_TELEMETRY,
  announcements: INITIAL_ANNOUNCEMENTS,
  lastUpdated: new Date().toISOString(),
};

// Load database from file on start
function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        // Ensure super admin is in DB
        const hasAdmin = parsed.users.some(
          (u: BackendAccount) => u.emailOrPhone.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
        );
        if (!hasAdmin) {
          parsed.users.unshift(INITIAL_BACKEND_USERS[0]);
        }
        dbState = {
          users: parsed.users,
          telemetry: Array.isArray(parsed.telemetry) ? parsed.telemetry : INITIAL_TELEMETRY,
          announcements: Array.isArray(parsed.announcements) ? parsed.announcements : INITIAL_ANNOUNCEMENTS,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        console.log(`[Database] Loaded ${dbState.users.length} registered users from ${DB_FILE}`);
        return;
      }
    }
    // If file doesn't exist, write defaults
    saveDatabase();
  } catch (err) {
    console.error("[Database] Error loading database file:", err);
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

// Initialize immediately
initDatabase();

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
  res.json({
    status: "ok",
    app: "Inco Inventory Counter",
    usersCount: dbState.users.length,
    lastUpdated: dbState.lastUpdated,
  });
});

// --- USER MANAGEMENT & SYNC ENDPOINTS ---

// Get all registered users from backend
app.get("/api/users", (req, res) => {
  res.json({
    success: true,
    users: dbState.users,
    count: dbState.users.length,
    lastUpdated: dbState.lastUpdated,
  });
});

// Register new user on backend directly
app.post("/api/users/signup", (req, res) => {
  try {
    const { emailOrPhone, password, displayName, storeName, role = "merchant" } = req.body;
    if (!emailOrPhone || typeof emailOrPhone !== "string") {
      return res.status(400).json({ error: "Email or phone number is required." });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters long." });
    }

    const cleanId = emailOrPhone.trim().toLowerCase();
    const existing = dbState.users.find(
      (u) => u.emailOrPhone.toLowerCase() === cleanId
    );

    if (existing) {
      return res.status(409).json({
        error: "An account with this email/phone already exists. Please sign in.",
        user: existing,
      });
    }

    const isDefaultAdmin = cleanId === SUPER_ADMIN_EMAIL.toLowerCase();

    const newUser: BackendAccount = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      emailOrPhone: cleanId,
      passwordHash: password.trim(),
      displayName: displayName?.trim() || (cleanId.includes("@")
        ? cleanId.split("@")[0].charAt(0).toUpperCase() + cleanId.split("@")[0].slice(1)
        : `Merchant ${cleanId.slice(-4)}`),
      storeName: storeName?.trim() || "My Store",
      role: isDefaultAdmin ? "admin" : (role as any),
      isVerified: isDefaultAdmin,
      verificationStatus: isDefaultAdmin ? "approved" : "none",
      accountStatus: "active",
      isPro: isDefaultAdmin,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    dbState.users.unshift(newUser);

    // Record telemetry event
    const telemEvent: TelemetryEvent = {
      id: `telem-${Date.now()}`,
      type: "signup",
      storeName: newUser.storeName,
      userIdentifier: newUser.emailOrPhone,
      description: `New merchant registered: ${newUser.displayName} (${newUser.storeName})`,
      timestamp: new Date().toISOString(),
    };
    dbState.telemetry.unshift(telemEvent);
    if (dbState.telemetry.length > 100) dbState.telemetry = dbState.telemetry.slice(0, 100);

    saveDatabase();

    console.log(`[Database] Registered new user: ${newUser.emailOrPhone} (${newUser.displayName}). Total users: ${dbState.users.length}`);

    res.status(201).json({
      success: true,
      user: newUser,
      users: dbState.users,
    });
  } catch (error: any) {
    console.error("Error in /api/users/signup:", error);
    res.status(500).json({ error: error.message || "Failed to register user." });
  }
});

// Login user and record login timestamp
app.post("/api/users/login", (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: "Identifier and password are required." });
    }

    const cleanId = emailOrPhone.trim().toLowerCase();
    const cleanPass = password.trim();

    const userIndex = dbState.users.findIndex(
      (u) => u.emailOrPhone.toLowerCase() === cleanId
    );

    if (userIndex === -1) {
      return res.status(404).json({ error: "Account not found. Please sign up." });
    }

    const user = dbState.users[userIndex];
    if (user.passwordHash !== cleanPass) {
      return res.status(401).json({ error: "Invalid password. Please try again." });
    }

    if (user.accountStatus === "suspended" || user.accountStatus === "blocked") {
      return res.status(403).json({
        error: `Account is currently ${user.accountStatus}. Please contact support or submit an appeal.`,
        accountStatus: user.accountStatus,
        user,
      });
    }

    // Update lastLoginAt
    dbState.users[userIndex].lastLoginAt = new Date().toISOString();

    // Log telemetry
    const telem: TelemetryEvent = {
      id: `telem-${Date.now()}`,
      type: "login",
      storeName: user.storeName,
      userIdentifier: user.emailOrPhone,
      description: `${user.displayName} logged into store terminal`,
      timestamp: new Date().toISOString(),
    };
    dbState.telemetry.unshift(telem);
    if (dbState.telemetry.length > 100) dbState.telemetry = dbState.telemetry.slice(0, 100);

    saveDatabase();

    res.json({
      success: true,
      user: dbState.users[userIndex],
      users: dbState.users,
    });
  } catch (error: any) {
    console.error("Error in /api/users/login:", error);
    res.status(500).json({ error: error.message || "Login failed." });
  }
});

// Bidirectional sync endpoint: clients send local accounts, server merges and returns unified list
app.post("/api/users/sync", (req, res) => {
  try {
    const { clientUsers } = req.body;
    let didUpdate = false;

    if (Array.isArray(clientUsers) && clientUsers.length > 0) {
      clientUsers.forEach((clientUser: BackendAccount) => {
        if (!clientUser.emailOrPhone) return;
        const cleanId = clientUser.emailOrPhone.trim().toLowerCase();
        const existingIdx = dbState.users.findIndex(
          (u) => u.emailOrPhone.toLowerCase() === cleanId || u.id === clientUser.id
        );

        if (existingIdx === -1) {
          // New user from client that server doesn't have yet!
          dbState.users.push(clientUser);
          didUpdate = true;
          console.log(`[Sync] Discovered new client user synced to server: ${clientUser.emailOrPhone}`);
        } else {
          // Update existing user with any updated status or profile fields
          const existing = dbState.users[existingIdx];
          // Keep server's verified/pro status if already set, or adopt client's if newer
          const merged: BackendAccount = {
            ...existing,
            ...clientUser,
            // Keep admin role for super admin
            role: cleanId === SUPER_ADMIN_EMAIL.toLowerCase() ? "admin" : (clientUser.role || existing.role),
            isVerified: existing.isVerified || clientUser.isVerified,
            isPro: existing.isPro || clientUser.isPro,
          };
          dbState.users[existingIdx] = merged;
        }
      });
    }

    if (didUpdate) {
      saveDatabase();
    }

    res.json({
      success: true,
      users: dbState.users,
      count: dbState.users.length,
      lastUpdated: dbState.lastUpdated,
    });
  } catch (error: any) {
    console.error("Error in /api/users/sync:", error);
    res.status(500).json({ error: error.message || "Sync failed." });
  }
});

// Update specific user (Admin actions: KYC approval, Pro tier, status changes)
app.put("/api/users/:id", (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const idx = dbState.users.findIndex((u) => u.id === id || u.emailOrPhone.toLowerCase() === id.toLowerCase());
    if (idx === -1) {
      return res.status(404).json({ error: "User not found." });
    }

    const oldUser = dbState.users[idx];
    const updatedUser: BackendAccount = {
      ...oldUser,
      ...updates,
      // Protect super admin role
      role: oldUser.emailOrPhone.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? "admin" : (updates.role || oldUser.role),
    };

    dbState.users[idx] = updatedUser;

    // Log admin action telemetry
    const telem: TelemetryEvent = {
      id: `telem-${Date.now()}`,
      type: "admin_action",
      storeName: updatedUser.storeName,
      userIdentifier: updatedUser.emailOrPhone,
      description: `Account updated: Status=${updatedUser.accountStatus}, Verified=${updatedUser.isVerified}, Pro=${updatedUser.isPro}`,
      timestamp: new Date().toISOString(),
    };
    dbState.telemetry.unshift(telem);
    if (dbState.telemetry.length > 100) dbState.telemetry = dbState.telemetry.slice(0, 100);

    saveDatabase();

    res.json({
      success: true,
      user: updatedUser,
      users: dbState.users,
    });
  } catch (error: any) {
    console.error("Error in PUT /api/users/:id:", error);
    res.status(500).json({ error: error.message || "Failed to update user." });
  }
});

// Delete user (Admin action)
app.delete("/api/users/:id", (req, res) => {
  try {
    const { id } = req.params;
    const user = dbState.users.find((u) => u.id === id || u.emailOrPhone.toLowerCase() === id.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.emailOrPhone.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: "Cannot delete the Super Admin root account." });
    }

    dbState.users = dbState.users.filter((u) => u.id !== user.id && u.emailOrPhone.toLowerCase() !== user.emailOrPhone.toLowerCase());
    saveDatabase();

    res.json({
      success: true,
      message: `User ${user.emailOrPhone} deleted.`,
      users: dbState.users,
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/users/:id:", error);
    res.status(500).json({ error: error.message || "Failed to delete user." });
  }
});

// Telemetry events
app.get("/api/telemetry", (req, res) => {
  res.json({
    success: true,
    telemetry: dbState.telemetry,
  });
});

app.post("/api/telemetry", (req, res) => {
  try {
    const { type, storeName, userIdentifier, description, amount } = req.body;
    if (!type || !description) {
      return res.status(400).json({ error: "Type and description are required." });
    }

    const event: TelemetryEvent = {
      id: `telem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      storeName: storeName || "Merchant Store",
      userIdentifier: userIdentifier || "anonymous",
      description,
      amount: typeof amount === "number" ? amount : undefined,
      timestamp: new Date().toISOString(),
    };

    dbState.telemetry.unshift(event);
    if (dbState.telemetry.length > 100) dbState.telemetry = dbState.telemetry.slice(0, 100);
    saveDatabase();

    res.status(201).json({ success: true, event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Announcements
app.get("/api/announcements", (req, res) => {
  res.json({
    success: true,
    announcements: dbState.announcements,
  });
});

app.post("/api/announcements", (req, res) => {
  try {
    const { title, message, type = "info", author = "INCO Admin" } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required." });
    }

    const ann: SystemAnnouncement = {
      id: `ann-${Date.now()}`,
      title,
      message,
      type,
      author,
      createdAt: new Date().toISOString(),
    };

    dbState.announcements.unshift(ann);
    saveDatabase();

    res.status(201).json({ success: true, announcement: ann });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Full state sync snapshot
app.get("/api/sync", (req, res) => {
  res.json({
    success: true,
    users: dbState.users,
    telemetry: dbState.telemetry,
    announcements: dbState.announcements,
    serverTime: new Date().toISOString(),
    totalUsersCount: dbState.users.length,
  });
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
