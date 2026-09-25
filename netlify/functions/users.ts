export interface NetlifyAccount {
  id: string;
  emailOrPhone: string;
  displayName: string;
  storeName: string;
  role: "admin" | "merchant" | "manager" | "cashier";
  isVerified: boolean;
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  accountStatus: "active" | "pending_approval" | "suspended" | "blocked";
  isPro: boolean;
  avatarUrl: string;
  createdAt: string;
  lastLoginAt?: string;
}

const DEFAULT_USERS: NetlifyAccount[] = [
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
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const DEMO_BLOCKED_EMAILS = [
  "merchant@kiosk.com",
  "david@kiosk.com",
  "merchant@inco.app",
  "cashier1@inco.app",
  "demo@inco.app",
  "test@inco.app",
  "demo-merchant@inco.app",
  "john@example.com",
];

// In-memory persistent cache for serverless invocation
let serverlessUsers: NetlifyAccount[] = [...DEFAULT_USERS];

export const handler = async (event: any) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const path = event.path || "";

  try {
    // 1. GET /api/users
    if (event.httpMethod === "GET") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          users: serverlessUsers,
          total: serverlessUsers.length,
          lastUpdated: new Date().toISOString(),
        }),
      };
    }

    // 2. POST /api/users/signup or /api/users/sync
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}");
      const isSignup =
        path.includes("signup") ||
        (event.rawUrl && event.rawUrl.includes("signup")) ||
        data.action === "signup" ||
        data.password !== undefined;

      if (isSignup) {
        const cleanId = (data.emailOrPhone || "").trim().toLowerCase();
        if (!cleanId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing emailOrPhone" }) };
        }

        const existingIndex = serverlessUsers.findIndex(
          (u) => u.emailOrPhone.toLowerCase() === cleanId || u.id === cleanId
        );

        if (existingIndex !== -1) {
          const existing = serverlessUsers[existingIndex];
          existing.displayName = data.displayName?.trim() || existing.displayName;
          existing.storeName = data.storeName?.trim() || existing.storeName;
          if (data.avatarUrl) existing.avatarUrl = data.avatarUrl;
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, user: existing, message: "User synced with backend" }),
          };
        }

        const isDefaultAdmin = cleanId === "settaholdings@gmail.com";
        const newUser: NetlifyAccount = {
          id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          emailOrPhone: cleanId,
          displayName:
            data.displayName?.trim() ||
            (cleanId.includes("@") ? cleanId.split("@")[0] : `Merchant ${cleanId.slice(-4)}`),
          storeName: data.storeName?.trim() || "My Store",
          role: isDefaultAdmin ? "admin" : (data.role || "merchant"),
          isVerified: true,
          verificationStatus: "approved",
          accountStatus: "active",
          isPro: isDefaultAdmin,
          avatarUrl:
            data.avatarUrl ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
          createdAt: new Date().toISOString(),
        };

        serverlessUsers = [newUser, ...serverlessUsers];

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ success: true, user: newUser, message: "Account created on backend" }),
        };
      }

      // 3. POST /api/users/sync
      const clientUsers = Array.isArray(data.clientUsers) ? data.clientUsers : [];

      const map = new Map<string, NetlifyAccount>();
      serverlessUsers.forEach((u) => map.set(u.emailOrPhone.toLowerCase(), u));

      clientUsers.forEach((cu: any) => {
        if (cu && cu.emailOrPhone) {
          const key = cu.emailOrPhone.toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              id: cu.id || `user-${Date.now()}`,
              emailOrPhone: key,
              displayName: cu.displayName || key.split("@")[0],
              storeName: cu.storeName || "My Store",
              role: key === "settaholdings@gmail.com" ? "admin" : (cu.role || "merchant"),
              isVerified: cu.isVerified ?? true,
              verificationStatus: cu.verificationStatus || "approved",
              accountStatus: cu.accountStatus || "active",
              isPro: cu.isPro || key === "settaholdings@gmail.com",
              avatarUrl: cu.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
              createdAt: cu.createdAt || new Date().toISOString(),
            });
          }
        }
      });

      if (!map.has("settaholdings@gmail.com")) {
        map.set("settaholdings@gmail.com", DEFAULT_USERS[0]);
      }

      serverlessUsers = Array.from(map.values()).filter(
        (u) =>
          u.emailOrPhone?.toLowerCase() === "settaholdings@gmail.com" ||
          (!DEMO_BLOCKED_EMAILS.includes((u.emailOrPhone || "").toLowerCase()) &&
            !(u.id || "").toLowerCase().startsWith("demo-") &&
            !(u.id || "").toLowerCase().startsWith("user-demo-") &&
            !(u.emailOrPhone || "").toLowerCase().includes("kiosk.com"))
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, users: serverlessUsers }),
      };
    }

    // 4. PUT /api/users/:id
    if (event.httpMethod === "PUT") {
      const parts = path.split("/").filter(Boolean);
      const targetId = decodeURIComponent(parts[parts.length - 1] || "").toLowerCase();
      const updates = JSON.parse(event.body || "{}");
      const idx = serverlessUsers.findIndex(
        (u) => u.id.toLowerCase() === targetId || u.emailOrPhone.toLowerCase() === targetId
      );

      if (idx !== -1) {
        serverlessUsers[idx] = { ...serverlessUsers[idx], ...updates };
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, user: serverlessUsers[idx] }),
        };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ error: "User not found" }) };
    }

    // 5. DELETE /api/users/:id
    if (event.httpMethod === "DELETE") {
      const parts = path.split("/").filter(Boolean);
      const targetId = decodeURIComponent(parts[parts.length - 1] || "").toLowerCase();
      if (targetId === "settaholdings@gmail.com" || targetId === "user-super-admin-01") {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "Cannot delete master administrator" }) };
      }
      serverlessUsers = serverlessUsers.filter(
        (u) => u.id.toLowerCase() !== targetId && u.emailOrPhone.toLowerCase() !== targetId
      );
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, users: serverlessUsers }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err?.message || "Internal server error" }),
    };
  }
};
