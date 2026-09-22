export interface VerifiedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

const FIREBASE_PROJECT_ID = "gen-lang-client-0265338813";
export const SUPER_ADMIN_EMAIL = "settaholdings@gmail.com";

/**
 * Validates a Firebase ID token using Google's secure token verification endpoint.
 * Ensures the token was issued by Google Firebase for this specific project and is not expired.
 */
export async function verifyFirebaseIdToken(authHeader?: string): Promise<VerifiedUser | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.split("Bearer ")[1]?.trim();
  if (!idToken) return null;

  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!res.ok) {
      return null;
    }

    const payload = (await res.json()) as {
      aud?: string;
      iss?: string;
      sub?: string;
      user_id?: string;
      email?: string;
      email_verified?: string | boolean;
      exp?: string;
    };

    // Verify audience matches our specific Firebase Project ID
    if (payload.aud !== FIREBASE_PROJECT_ID) {
      console.warn("[Auth] Token audience mismatch:", payload.aud, "expected:", FIREBASE_PROJECT_ID);
      return null;
    }

    // Verify issuer matches Google Secure Token Service for this project
    const expectedIss = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
    if (payload.iss !== expectedIss) {
      console.warn("[Auth] Token issuer mismatch:", payload.iss);
      return null;
    }

    const uid = payload.user_id || payload.sub;
    if (!uid) return null;

    const emailVerified =
      payload.email_verified === true ||
      payload.email_verified === "true";

    return {
      uid,
      email: payload.email || null,
      emailVerified,
    };
  } catch (err) {
    console.error("[Auth] Token verification network failure:", err);
    return null;
  }
}

/**
 * Checks if verified user is the authorized platform super admin
 */
export function isPlatformAdmin(user: VerifiedUser): boolean {
  if (!user.email) return false;
  return user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}
