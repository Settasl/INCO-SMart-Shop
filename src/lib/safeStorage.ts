// Safari-hardened and cross-browser safe storage with in-memory fallback
// Completely prevents SecurityError or QuotaExceededError crashes on iOS Safari, Private Browsing, and Mac

const memoryStore: Record<string, string> = {};

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    const testKey = "__inco_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const hasLocalStorage = isLocalStorageAvailable();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (hasLocalStorage && typeof window !== "undefined") {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (e) {
      // Fallback to memory
    }
    return memoryStore[key] || null;
  },

  setItem(key: string, value: string): boolean {
    memoryStore[key] = value;
    try {
      if (hasLocalStorage && typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (e: any) {
      // QuotaExceededError in Safari / Chrome when storing large data
      console.warn(`[safeStorage] localStorage quota reached or blocked for key "${key}". Maintained in memory fallback.`);
    }
    return false;
  },

  removeItem(key: string): void {
    delete memoryStore[key];
    try {
      if (hasLocalStorage && typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  },

  getJSON<T>(key: string, fallback: T): T {
    const raw = this.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      return fallback;
    }
  },

  setJSON<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      return this.setItem(key, serialized);
    } catch (e) {
      console.warn(`[safeStorage] Failed to serialize JSON for key "${key}":`, e);
      return false;
    }
  },
};
