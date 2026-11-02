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

## 3. Auth settings
**Authentication → URL Configuration**
- Site URL: your web address (for local testing `http://localhost:8081`).
- Redirect URLs: add `http://localhost:8081/auth/callback`, `rennovaai://auth/callback`, and later your production web URL + `/auth/callback`.

**Authentication → Providers → Email**: on by default. "Confirm email" is on by default — new users must click the emailed link before signing in. Turn it off while testing if you prefer.

## 4. Google and Apple sign-in (optional)
- **Google**: create an OAuth client in Google Cloud Console (type "Web application"), add the callback URL Supabase shows you, then paste the client ID and secret into **Authentication → Providers → Google**.
- **Apple**: needs a paid Apple Developer account. Create a Services ID and key, then fill in **Authentication → Providers → Apple**. Apple sign-in is required on the iOS App Store if Google sign-in is offered.

Until a provider is enabled, its button shows Supabase's "provider is not enabled" error.

## 5. Make yourself an admin
Sign up in the app with your own email (as a customer), then run in the SQL Editor:
```sql
update public.profiles set role = 'admin'
where email = 'you@example.com';
```
Sign out and back in — you land in the admin panel. Promote other admins from **Admin → Users**.

## What is stored where (this version)
- **Supabase**: accounts, roles, suspended status, vendor applications and their verification/approval.
- **Still on the device**: customer designs, cost estimates, bookings, escrow milestones and chat (signing out clears them from the device). Moving these to Supabase is the next step.
