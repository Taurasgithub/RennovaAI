# RennovaAI — Android app

**See it before you build it.** RennovaAI lets people photograph a room, choose a style, colours and materials, see an AI preview of the renovated room, get an instant cost estimate, compare quotes from verified local vendors, and pay safely through milestone escrow.

Built with **Expo SDK 58 / React Native 0.88 / TypeScript / Expo Router**, ready to build an Android App Bundle (`.aab`) for Google Play with EAS Build.

| Brand colour | Hex | Used for |
|---|---|---|
| Teal (house) | `#0AB49A` | Primary actions, trust, selection |
| Navy (wordmark) | `#00275B` | Headings, dark surfaces |
| Amber (AI sparkle) | `#FEA923` | AI / generate actions, highlights |

---

## What's in the app

Customer journey from the business plan — **Scan → Design → Match → Compare → Build**:

| Screen | What it does |
|---|---|
| Onboarding | 3-slide intro (with a live before/after slider) + profile & city (Sukkur, Hyderabad, Karachi) |
| Home | Hero, 5-step journey, quick start by room type, style gallery, saved designs, active project, referral offer |
| Scan (`design/capture`) | Camera or gallery photo (or the built-in sample room), room type, floor area |
| Design (`design/customize`) | 6 styles, 8 palettes, wall finish, flooring, ceiling, add-ons, notes — live preview + running estimate |
| Generate | AI generation with progress steps |
| Result | Drag-to-compare before/after, quick palette tweaks, regenerate (3 free, unlimited with Premium), estimate, design brief, share |
| Cost estimate | Range, typical price, per-trade breakdown, timeline, trades needed |
| Compare quotes | Matching algorithm shortlists 3–5 verified vendors; side-by-side table; sort by match / price / speed / rating; budget filter |
| Vendor profile | Portfolio, verification checklist, reviews, availability |
| Book & pay | Start date, 30/40/30 milestone escrow, promo code `WELCOME1000`, JazzCash / Easypaisa / card |
| Project | Escrow progress, approve & release milestones, deposit next stage, chat, WhatsApp support, rate vendor |
| Chat | Customer ↔ vendor messages |
| Premium Design Pack | PKR 500 per project (student code `STUDENT` = free) |
| Become a vendor | Vendor registration + 4-step verification tracker (CNIC verified in person, never uploaded) |
| Profile | Edit details, city, support, privacy policy, delete-my-data |

### How the AI preview works
`src/services/ai.ts` picks one of three modes:

1. **No photo** → a vector *sample room* that redraws every surface from the user's choices (also used for vendor portfolios).
2. **Photo + AI server configured** (`EXPO_PUBLIC_API_URL`) → photorealistic render from `/server` (OpenAI image-edit model). The API key stays on the server.
3. **Photo, no server** → on-device colour preview of the photo, clearly labelled *Preview mode*.

### Cost engine & matching
- `src/lib/estimate.ts` — PKR rate card (walls, flooring, ceiling, add-ons) × style multiplier × city factor, −12% / +15% range, timeline in days. Rates live in `src/data/catalog.ts`.
- `src/lib/matching.ts` — scores vendors on rating, trade coverage, budget fit, availability, Vendor Pro featuring and track record; returns a 3–5 vendor shortlist.

---

## Run it locally

```bash
npm install
npx expo start          # press "a" for an Android emulator, or scan the QR with a development build
npm run typecheck
```

SDK 58's Expo Go only supports SDK 58, and this app uses native modules, so for a phone use a **development build**: `npx eas-cli@latest build -p android --profile development`.

### Optional: AI server
```bash
cd server
cp .env.example .env    # add OPENAI_API_KEY
npm install
npm start               # http://localhost:8080/health
```
Deploy it to any Node 20+ host (Render, Railway, Fly.io, a VPS…), then set `EXPO_PUBLIC_API_URL=https://your-server` in the app's `.env` (copy `.env.example`) and rebuild.

---

## Build for Google Play
See **[PUBLISHING.md](PUBLISHING.md)** for the full step-by-step (EAS account, signing, `.aab`, Play Console listing, Data safety, testing tracks).

Short version:
```bash
npm install -g eas-cli   # or use npx eas-cli@latest
eas login
eas init                 # links the project, writes the projectId into app.json
npm run build:android    # → production .aab (EAS manages the upload key)
npm run build:apk        # → installable test .apk
```

Store assets are in `store/` (512×512 icon, 1024×500 feature graphic, 1080×1920 phone screenshots, listing text, privacy policy).

---

## Project structure
```
src/
  app/                 Expo Router screens (file = route)
    (tabs)/            Home, Designs, Vendors, Projects, Profile
    design/            capture → customize → generate → result → estimate
    compare.tsx, book/[vendorId].tsx, project/[id].tsx, chat/[id].tsx,
    vendor/[id].tsx, vendor-signup.tsx, premium.tsx, onboarding.tsx
  components/          UI kit, RoomIllustration, BeforeAfter slider, DesignPreview, VendorCard
  data/                Catalog (styles, palettes, materials, rates) and sample vendors
  lib/                 Cost engine, matching algorithm, formatting
  services/ai.ts       AI preview client
  store/useApp.ts      Zustand store persisted with AsyncStorage
  theme/               Brand tokens
server/                Express AI proxy (POST /api/visualize)
store/                 Play Store graphics, screenshots, listing, privacy policy
assets/                App icon, adaptive icon, splash, logo
```

---

## Going live — what is still simulated in this beta
Everything below is marked with `TODO(go-live)` in the code:

| Area | Beta behaviour | To go live |
|---|---|---|
| Vendors | 12 sample listings in `src/data/vendors.ts` (labelled *Beta · sample listings* in the app) | Replace with your vendor API / Firebase collection after onboarding real, verified vendors |
| Payments & escrow | Test mode — no money moves | Integrate JazzCash / Easypaisa / card gateway server-side; hold funds in an escrow account |
| Chat | Stored on device, simulated vendor replies | Firebase / WebSocket real-time messaging + push notifications |
| Accounts | Profile stored on device | Phone OTP auth (e.g. Firebase Auth) and a backend database |
| Premium pack | Unlocks locally | Charge via the payment gateway (or Google Play Billing for digital goods) |
| Urdu interface | English only | Add i18n (the plan calls for Urdu + English) |

Before publishing publicly, also: host the privacy policy at a real URL, set `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_SUPPORT_WHATSAPP` and `EXPO_PUBLIC_SUPPORT_EMAIL`, and replace the sample vendors.
