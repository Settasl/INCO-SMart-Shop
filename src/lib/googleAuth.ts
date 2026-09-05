import firebaseConfig from "../../firebase-applet-config.json";

export interface GoogleProfile {
  email: string;
  name?: string;
  photoURL?: string;
  sub?: string;
  accessToken?: string;
  idToken?: string;
}

/**
 * Ensures Google Identity Services (GIS) library is loaded in the browser.
 */
export function loadGoogleGIS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window object not available"));
      return;
    }

    if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
      resolve();
      return;
    }

    // Check if script tag is already in DOM
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

/**
 * Requests Google authentication token via Google Identity Services (OAuth2).
 * Works reliably inside iframes and cross-origin sandboxes without requiring domain whitelist in Firebase popup.
 */
export function requestGoogleProfileGIS(hintEmail?: string): Promise<GoogleProfile> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGoogleGIS();

      if (!window.google?.accounts?.oauth2) {
        reject(new Error("Google Identity Services not initialized"));
        return;
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: "openid email profile",
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }

          if (!response.access_token) {
            reject(new Error("No access token returned from Google"));
            return;
          }

          try {
            // Retrieve authentic user profile from Google's official userinfo endpoint
            const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            });

            if (!userInfoRes.ok) {
              const errBody = await userInfoRes.text();
              throw new Error(`Google profile request failed (${userInfoRes.status}): ${errBody}`);
            }

            const profile = await userInfoRes.json();
            const email = (profile.email || "").toLowerCase().trim();

            if (!email) {
              throw new Error("No verified email address provided by Google account");
            }

            resolve({
              email,
              name: profile.name || profile.given_name || email.split("@")[0],
              photoURL: profile.picture || undefined,
              sub: profile.sub,
              accessToken: response.access_token,
            });
          } catch (fetchErr) {
            reject(fetchErr);
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || "Google authentication dialog was closed"));
        },
      });

      // Request access token with account selection
      client.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Checks whether an email address belongs to Gmail or Google domain
 */
export function isGoogleEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase().trim() || "";
  return domain === "gmail.com" || domain === "googlemail.com";
}
