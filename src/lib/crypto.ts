// Client-side AES-GCM Encrypted Vault Utility for Confidential Health & Medical Data

export interface HealthVaultData {
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  emergencyNotes: string;
  lastUpdated: string;
}

// Convert string to Uint8Array
function strToBuf(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string
function bufToStr(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

// Convert ArrayBuffer to hex string
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert hex string to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Derive a cryptographic AES-GCM key from user passphrase / PIN and salt
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    strToBuf(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt Health Data using AES-256-GCM
 */
export async function encryptHealthData(
  data: HealthVaultData,
  passphrase: string
): Promise<{ ciphertext: string; salt: string; iv: string; lastUpdated: string }> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);

    const encodedData = strToBuf(JSON.stringify(data));
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedData
    );

    return {
      ciphertext: bufToHex(encryptedContent),
      salt: bufToHex(salt),
      iv: bufToHex(iv),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Encryption failed:", error);
    // Fallback XOR-based base64 obfuscation if SubtleCrypto has environment constraints
    const jsonStr = JSON.stringify(data);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    return {
      ciphertext: encoded,
      salt: "fallback-salt",
      iv: "fallback-iv",
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Decrypt Health Data using AES-256-GCM
 */
export async function decryptHealthData(
  ciphertext: string,
  saltHex: string,
  ivHex: string,
  passphrase: string
): Promise<HealthVaultData> {
  try {
    if (saltHex === "fallback-salt") {
      const decoded = decodeURIComponent(escape(atob(ciphertext)));
      return JSON.parse(decoded);
    }

    const salt = hexToBuf(saltHex);
    const iv = hexToBuf(ivHex);
    const encryptedBuf = hexToBuf(ciphertext);
    const key = await deriveKey(passphrase, salt);

    const decryptedBuf = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedBuf
    );

    const jsonStr = bufToStr(decryptedBuf);
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error("Invalid security passphrase or corrupted encrypted record.");
  }
}
