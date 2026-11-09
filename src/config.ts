// App-wide configuration. Values prefixed EXPO_PUBLIC_ are read from `.env`
// at build time (see .env.example). Never put secret API keys here — the AI
// key lives only on the server in /server.

export const config = {
  /** Base URL of the RennovaAI API server (see /server). Leave empty to run in on-device preview mode. */
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, ''),
  /** Supabase project (accounts & roles). Both values are public by design; row-level security protects the data. */
  supabaseUrl: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, ''),
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  /**
   * Show "Continue with Apple" on Android and web too. Off until Apple's web sign-in is set up
   * (paid Apple Developer account: Services ID + secret, supabase/README.md step 5).
   * iPhone always shows it: it uses Apple's native sheet, which needs no secret.
   */
  appleWebSignIn: process.env.EXPO_PUBLIC_APPLE_WEB_SIGNIN === 'true',
  supportWhatsApp: process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ?? '923000000000',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@rennovaai.com',
  privacyPolicyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://rennovaai.com/privacy',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://rennovaai.com/terms',

  /** Business rules from the RennovaAI mini business plan. */
  freeRegenerationsPerDesign: 3,
  premiumPackPrice: 500, // PKR per project
  referralDiscount: 1000, // PKR off first booking
  referralCode: 'WELCOME1000',
  studentCode: 'STUDENT', // free Premium Design Pack during university launch
  commissionRate: 0.1, // average platform commission (deducted from vendor payout)
  cities: ['Sukkur', 'Hyderabad', 'Karachi'] as const,
};

export type City = (typeof config.cities)[number];
