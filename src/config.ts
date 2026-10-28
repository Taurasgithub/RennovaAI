// App-wide configuration. Values prefixed EXPO_PUBLIC_ are read from `.env`
// at build time (see .env.example). Never put secret API keys here — the AI
// key lives only on the server in /server.

export const config = {
  /** Base URL of the RennovaAI API server (see /server). Leave empty to run in on-device preview mode. */
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, ''),
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
