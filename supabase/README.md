# Accounts setup (Supabase)

RennovaAI has three kinds of account, each with its own area of the app:

| Role | Signs up as | Lands on |
|---|---|---|
| Customer | "Customer" on the Welcome screen | The customer app (Home, Designs, Vendors, Projects, Profile) |
| Vendor | "Service vendor" on the Welcome screen | **Vendor Hub** (`/vendor-hub`): application, verification status, leads |
| Admin | Never from the app — promoted with SQL (step 5) | **Admin panel** (`/admin`): overview, vendor approvals, users. Sidebar layout in a browser, tabs on a phone |

Until `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set, the app runs in on-device mode with no sign-in.

## 1. Create the project
1. Sign up at <https://supabase.com> and create a project (free tier is fine). Pick a region close to Pakistan (e.g. Mumbai / Singapore).
2. **Project Settings → API**: copy the **Project URL** and the **publishable** (anon) key into the app's `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   Both are safe to ship in the app — row-level security protects the data. **Never** put the `service_role` / secret key in the app.
3. Restart Expo (`npx expo start`) so the new values are bundled.

## 2. Create the tables and security rules
In **SQL Editor → New query**, run each file once, in order:
1. [`migrations/0001_accounts.sql`](migrations/0001_accounts.sql): accounts, roles, vendor applications.
2. [`migrations/0002_profiles.sql`](migrations/0002_profiles.sql): personalised profiles (photo, bio, customer preferences, admin job title, vendor business profile) and the `avatars` / `vendor-media` photo buckets. Users can only upload into their own folder.
3. [`migrations/0003_social_signin.sql`](migrations/0003_social_signin.sql): Google/Apple users still complete the profile step (their name is pre-filled) and their provider photo becomes the starting profile photo.

## 3. Auth settings
**Authentication → URL Configuration**
- Site URL: your web address (for local testing `http://localhost:8081`).
- Redirect URLs (add all of these):
  - `http://localhost:8081/auth/callback`: web, local testing
  - `rennovaai://auth/callback`: installed app (development / production builds)
  - `exp://**`: Expo Go on a phone (its address changes with your Wi-Fi IP, hence the wildcard; remove before going live)
  - later: your production web URL + `/auth/callback`

**Authentication → Providers → Email**: on by default. "Confirm email" is on by default — new users must click the emailed link before signing in. Turn it off while testing if you prefer.

## 4. Continue with Google
How the app does it: Supabase's web sign-in (OAuth + PKCE). On the web it redirects to Google and back to `/auth/callback`. In the app it opens Google in an in-app browser and returns via `rennovaai://auth/callback`. No native Google SDK is needed.

1. **Copy the callback URL from Supabase**: **Authentication → Providers → Google** shows a *Callback URL* like `https://<project-ref>.supabase.co/auth/v1/callback`. Keep that page open.
2. **Google Cloud Console** (<https://console.cloud.google.com>) → create or select a project → **Google Auth Platform**:
   - **Branding**: app name *RennovaAI*, support email, logo (optional), and your privacy-policy link.
   - **Audience**: *External*. While the app is in *Testing*, add your own Gmail and teammates' as test users. Press *Publish app* when you go live.
   - **Data Access**: scopes `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile` (the last two are added by default; add `openid`). No sensitive scopes are needed, so no Google review is required.
   - **Clients → Create client → Web application**:
     - *Authorized JavaScript origins*: `http://localhost:8081` (and later your production web origin).
     - *Authorized redirect URIs*: the Supabase callback URL from step 1.
     - Create, then copy the **Client ID** and **Client secret**.
3. Back in **Supabase → Providers → Google**: switch **Enable** on, paste the Client ID and Client secret, then **Save**.
4. Test: open the app → Welcome → *Continue with Google*. A new account goes to the profile step with the Google name and photo pre-filled.

## 5. Continue with Apple
Needs a paid **Apple Developer Program** membership. How the app does it:
- **iPhone/iPad**: Apple's own native sheet (`expo-apple-authentication`). The identity token goes to Supabase with a SHA-256 nonce. No client secret is needed for this path.
- **Android and web**: Apple has no native sign-in there, so the app uses Supabase's web OAuth (same redirect URLs as Google). This path needs the Services ID + secret below.

In **Apple Developer → Certificates, Identifiers & Profiles**:
1. **App ID**: *Identifiers → +* → App IDs → bundle ID `com.rennovaai.app` (must match `app.json`). Under Capabilities, tick **Sign in with Apple**. Leave the server-to-server notification URL empty.
2. **Services ID** (for Android/web): *Identifiers → +* → Services IDs → e.g. `com.rennovaai.app.web`. Enable **Sign in with Apple** → *Configure*:
   - Primary App ID: `com.rennovaai.app`
   - Domains: `<project-ref>.supabase.co`
   - Return URLs: `https://<project-ref>.supabase.co/auth/v1/callback`
3. **Key**: *Keys → +* → tick **Sign in with Apple**, set the primary App ID, then download `AuthKey_XXXXXXXXXX.p8`. Store it safely; Apple lets you download it once. Note the **Key ID** and your **Team ID** (top-right of the developer site).
4. **Client secret**: on Supabase's Apple guide (<https://supabase.com/docs/guides/auth/social-login/auth-apple>) use the secret generator with Team ID, Services ID, Key ID and the `.p8` file. Use Chrome or Firefox; the generator doesn't work in Safari.
   ⚠️ The secret **expires after 6 months**. Set a calendar reminder to regenerate it, or Apple sign-in on Android/web stops working.

In **Supabase → Authentication → Providers → Apple**: switch **Enable** on, then fill in:
- **Client IDs**, comma-separated, Services ID **first**: `com.rennovaai.app.web,com.rennovaai.app,host.exp.Exponent`
  - `com.rennovaai.app`: the native iOS app
  - `host.exp.Exponent`: only so native Apple sign-in works inside Expo Go while testing; remove before going live
- **Secret Key (for OAuth)**: the generated secret from step 4.

Testing native Apple sign-in needs a real iPhone (the iOS Simulator is limited). Expo Go works for a first test. Development and production builds pick up the *Sign in with Apple* capability from `app.json` (`ios.usesAppleSignIn`).

Notes:
- Apple shares the user's name only on the **first** sign-in. The app saves it then and pre-fills the profile step.
- Users may choose *Hide my email*. Their account email is then an `@privaterelay.appleid.com` address. To email them, register your sending domain under *Services → Sign in with Apple for Email Communication*.
- Until a provider is enabled in Supabase, its button shows *"This sign-in option is not set up yet."*

## 6. Make yourself an admin
Sign up in the app with your own email (as a customer), then run in the SQL Editor:
```sql
update public.profiles set role = 'admin'
where email = 'you@example.com';
```
Sign out and back in — you land in the admin panel. Promote other admins from **Admin → Users**.

## What is stored where (this version)
- **Supabase**: accounts (email, Google, Apple), roles, suspended status, personal profiles and photos, vendor applications, verification/approval and vendor business profiles.
- **Still on the device**: customer designs, cost estimates, bookings, escrow milestones and chat (signing out clears them from the device). Moving these to Supabase is the next step.
