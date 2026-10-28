# Publishing RennovaAI to Google Play

This app targets **Android 16 (API 36)** with min SDK 24 (Android 7.0), which meets Google Play's target-API rule for new apps and updates from 31 August 2026.

## 1. One-time setup

1. **Google Play developer account** — https://play.google.com/console (one-time US$25 fee).
   - *Personal* accounts created after Nov 2023 must run a **closed test with at least 12 testers for 14 continuous days** before they can apply for production access, and Google checks that testers actually used the app.
   - An *organization* account (e.g. after registering RennovaAI with SECP) is exempt from that rule but needs a D-U-N-S number.
2. **Expo account** — https://expo.dev/signup (free tier is enough to build).
3. Install and log in:
   ```bash
   npm install
   npx eas-cli@latest login
   npx eas-cli@latest init        # creates the EAS project and adds extra.eas.projectId to app.json
   ```

## 2. Configure before the first build

- `app.json` → `android.package` is `com.rennovaai.app`. **It can never change after the first upload** — change it now if you want another ID.
- Copy `.env.example` → `.env` and set:
  - `EXPO_PUBLIC_API_URL` — your deployed `/server` URL (leave empty to ship with on-device preview mode)
  - `EXPO_PUBLIC_SUPPORT_WHATSAPP`, `EXPO_PUBLIC_SUPPORT_EMAIL`
  - `EXPO_PUBLIC_PRIVACY_URL` — Google requires a public privacy-policy URL (host `store/privacy-policy.html`, e.g. GitHub Pages)
- For EAS cloud builds, add the same variables as EAS environment variables (expo.dev → project → Environment variables) or in `eas.json` under `build.production.env`, because `.env` is git-ignored.

## 3. Build

```bash
npm run build:apk        # preview .apk — install on your own phone to test
npm run build:android    # production .aab for Google Play
```
On the first production build EAS offers to **generate the Android upload keystore** — say yes. EAS stores it; back it up with `npx eas-cli@latest credentials`. `versionCode` auto-increments on every production build (`appVersionSource: remote`).

## 4. Create the app in Play Console

1. **Create app** → name *RennovaAI*, default language English (UK or US), App, Free.
2. **Store listing** — copy the text from `store/listing.md`, and upload:
   - App icon: `store/icon-512.png`
   - Feature graphic: `store/feature-graphic-1024x500.png`
   - Phone screenshots (2–8): `store/screenshots/*.png` (1080×1920)
3. **App content**:
   - Privacy policy URL (step 2)
   - Ads: *No ads*
   - App access: *All functionality available without special access* (no login wall)
   - Content rating questionnaire: utility/productivity, no violence or user-generated sexual content → expected **Everyone / PEGI 3**. Note: chat between customers and vendors counts as user interaction.
   - Target audience: 18+
   - Data safety: see the table below
   - Government apps: No. Financial features: declare that the app facilitates payments for services if you enable real payments.
4. **Testing → Closed testing** → create a track, add ≥12 testers (Google Group or email list), upload the `.aab`, roll out. Keep it running 14 days, collect feedback.
5. **Apply for production**, then **Production → Create release** → upload the `.aab` (or promote the tested release) → review → roll out.

Optional automated upload: create a Google Cloud service account with Play Console access, save its key as `google-play-service-account.json` (git-ignored), then `npm run submit:android`.

## 5. Data safety form (current beta build)

| Data type | Collected? | Notes |
|---|---|---|
| Name, phone number | Stored on device only in this beta | Becomes *collected* once you add a backend/auth |
| Photos | Shared with your AI server **only if** `EXPO_PUBLIC_API_URL` is set, for generating the preview; not stored by the server code provided | Purpose: app functionality |
| Messages (chat) | On device only in this beta | Becomes *collected* with real-time chat |
| Approximate/precise location | No | City is chosen manually |
| Financial info | No (payments in test mode) | Update when the gateway is integrated |

Data is encrypted in transit (HTTPS) and users can delete their data from **Profile → Delete my data & sign out**.

## 6. Updating the app
Change `version` in `app.json` (e.g. 1.0.1), run `npm run build:android`, upload the new `.aab`. For JS-only fixes you can also ship over-the-air updates with `eas update` after adding `expo-updates`.
