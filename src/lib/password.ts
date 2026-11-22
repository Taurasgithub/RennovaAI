/**
 * Password rules, shared by sign-up and "Set new password".
 * They mirror Supabase → Authentication → Email → Password requirements
 * ("Lowercase, uppercase letters, digits and symbols", minimum length 8).
 */
export const MIN_PASSWORD = 8;

/** Lowercase, uppercase, a digit and a symbol. */
export const isStrongPassword = (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);

/** Each rule on its own, for a live checklist. */
export const passwordChecks = (pw: string) => ({
  length: pw.length >= MIN_PASSWORD,
  lower: /[a-z]/.test(pw),
  upper: /[A-Z]/.test(pw),
  digit: /\d/.test(pw),
  symbol: /[^A-Za-z0-9]/.test(pw),
});
