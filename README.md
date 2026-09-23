<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a17bd3ec-0617-40a8-a1d4-72b7c4bc3ed0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
# Firebase operations

Deploy both Firestore and Storage rules before enabling production profile uploads:

```bash
firebase deploy --only firestore:rules,storage
```

Profile images are stored at `users/{uid}/profile.{extension}` and are limited to
5 MB image files. Referral invites are written to `referralInvites` and are
immutable; admin mutations are recorded in `adminAuditLogs`.

The admin console can block, suspend, approve, unblock, and remove the
Firestore profile for a user using the signed-in Firebase admin identity.
Deleting the Firebase Authentication identity itself requires a trusted
Admin SDK endpoint (for example a Netlify function with
`FIREBASE_SERVICE_ACCOUNT_JSON`); the client deliberately does not pretend
that a profile deletion also deletes Auth credentials.
