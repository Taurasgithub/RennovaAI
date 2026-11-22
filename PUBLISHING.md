# Publishing RennovaAI to Google Play

This app targets **Android 16 (API 36)** with min SDK 24 (Android 7.0), which meets Google Play's target-API rule for new apps and updates from 31 August 2026.

## TODO before publishing (dummy values)

The support contacts are **dummies** for now. `npm run release-check` lists every place left, and production EAS builds stop until they are replaced:

- [ ] Real support WhatsApp number → `eas.json` (`EXPO_PUBLIC_SUPPORT_WHATSAPP`, international format, no `+`)
- [ ] Real support email → `eas.json` (`EXPO_PUBLIC_SUPPORT_EMAIL`), `store/privacy-policy.html`, `store/terms.html`, `store/listing.md`
- [ ] Then `npm run site:deploy` so the public privacy policy and terms show the real email

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

- `app.json` → `android.package` is `com.rennovaai.app`. **It can never change after the first upload**, so change it now if you want another ID.
- The database must have all migrations applied (`supabase/README.md` step 2, including `0004_projects.sql`).
- The AI API is the Cloudflare Worker (`worker/README.md`), live at `https://rennovaai-ai.binance-live-mcp.workers.dev`.
- The public site is Cloudflare Pages project `rennovaai`: https://rennovaai.pages.dev with `/privacy`, `/terms` and `/delete-account`. Edit `store/privacy-policy.html` / `store/terms.html`, then run `npm run site:deploy`. The old Worker links redirect there.
- Build settings live in `eas.json` → `build.preview.env` / `build.production.env`, since `.env` is git-ignored. All of them are public values (no secrets). Before the first production build, replace the two placeholders:
  - `EXPO_PUBLIC_SUPPORT_EMAIL`: an inbox you actually read. Google emails it, and users send deletion requests to it.
  - `EXPO_PUBLIC_SUPPORT_WHATSAPP`: your support number, in international format without `+` (e.g. `923001234567`).
  The same email appears in `store/privacy-policy.html` and `store/terms.html`; update them and run `npm run site:deploy`.
- `EXPO_PUBLIC_PREMIUM` stays `false`. The paid Premium Design Pack is a digital upgrade, so Google Play only allows it through Play Billing, which isn't integrated yet.

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
   - Privacy policy URL: `https://rennovaai.pages.dev/privacy`
   - Ads: *No ads*
   - App access: *All or some functionality is restricted*. The app needs an account, so give Google's reviewers a working login:
     - Create a customer test account (e.g. `playreview@…`) with a saved design.
     - Create a vendor test account that you approve in Admin.
     - Enter both email/password pairs with short instructions ("Customer: Designs tab → open design → Get quotes → Book. Vendor: Vendor Hub → New requests").
   - Content rating questionnaire: utility/productivity, no violence or user-generated sexual content → expected **Everyone / PEGI 3**. Note: chat between customers and vendors counts as user interaction.
   - Target audience: 18+
   - Data safety: see the table below
   - Government apps: No. Financial features: *None*. RennovaAI does not process payments; customers pay vendors directly.
   - Account deletion: in-app (Profile/Account → Delete account) and the web link `https://rennovaai.pages.dev/delete-account`.
4. **Testing → Closed testing** → create a track, add ≥12 testers (Google Group or email list), upload the `.aab`, roll out. Keep it running 14 days, collect feedback.
5. **Apply for production**, then **Production → Create release** → upload the `.aab` (or promote the tested release) → review → roll out.

Optional automated upload: create a Google Cloud service account with Play Console access, save its key as `google-play-service-account.json` (git-ignored), then `npm run submit:android`.

## 5. Data safety form

Data is **encrypted in transit**. Users can **request deletion**, both in the app and at `/delete-account`. Nothing is sold, and there are no ads.

| Data type (Play category) | Collected | Shared | Purpose | Required? |
|---|---|---|---|---|
| Name, email address, phone number (Personal info) | Yes | Yes, with the vendor a customer books | App functionality, account management | Email required; phone optional |
| Photos (Photos and videos) | Yes | Yes, with the booked vendor; processed by the AI service to make the preview | App functionality | Optional (a sample room works without a photo) |
| Messages (in-app messages) | Yes | Yes, between the customer and vendor of a booking | App functionality | Optional |
| Other user-generated content (designs, notes, reviews) | Yes | Reviews are shown publicly with first name only | App functionality | Optional |
| User IDs | Yes | No | Account management | Required |
| Location, contacts, financial info, health, device IDs | No | No | | |

Service providers (Supabase, Cloudflare, Google/Apple sign-in, Expo) process data on our behalf. Play does not count that as "sharing".

## 6. Updating the app
Change `version` in `app.json` (e.g. 1.0.1), run `npm run build:android`, upload the new `.aab`. For JavaScript-only fixes you can ship over-the-air updates with `npx eas-cli@latest update --channel production`; `expo-updates` is already set up.
