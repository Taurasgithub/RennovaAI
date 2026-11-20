/**
 * Admin console theme: a graphite-black "operations console" where the logo's teal (#0AB49A) and
 * amber (#FEA923) are the only colours, so they stand out strongly.
 *
 * Semantic tokens only (the gluestack-ui rule): screens ask for `card`, `primary`, `attention`…,
 * never raw hex values, so the palette can be retuned in one place.
 * Contrast (UI/UX Pro Max checklist): `foreground`, `muted` and `subtle` all stay ≥ 4.5:1 on `card`.
 *
 * Roles:
 *  - graphite → every surface (background, cards, bars), in three depths; neutral, never blue
 *  - teal     → the one action/success colour (primary buttons, active nav, approved)
 *  - amber  → attention only (pending reviews, counts that need action), never decoration
 */
export const admin = {
  // Surfaces (darkest → lightest)
  background: '#0D1012',
  card: '#161B1E',
  cardRaised: '#1E2528',
  /** Top edge of cards: a slightly lighter line gives depth without shadows. */
  edge: '#353F43',
  border: '#2A3236',
  bar: '#111517',

  // Text
  foreground: '#F4F6F5',
  muted: '#A3ADAA',
  subtle: '#8A9592',

  // Logo accents
  primary: '#0AB49A',
  primaryForeground: '#0D1012',
  primarySoft: 'rgba(10,180,154,0.14)',
  primaryLine: 'rgba(10,180,154,0.45)',
  attention: '#FEA923',
  attentionForeground: '#0D1012',
  attentionSoft: 'rgba(254,169,35,0.13)',
  attentionLine: 'rgba(254,169,35,0.5)',

  // Destructive (the only non-logo colour; used for reject / suspend)
  danger: '#FF8080',
  dangerSoft: 'rgba(255,128,128,0.12)',
  dangerLine: 'rgba(255,128,128,0.45)',

  pressed: 'rgba(255,255,255,0.06)',
} as const;

export type AdminTone = 'primary' | 'attention' | 'danger' | 'neutral';

/** Colours for a tone (badges, tiles, soft buttons). */
export const toneColors: Record<AdminTone, { fg: string; soft: string; line: string }> = {
  primary: { fg: admin.primary, soft: admin.primarySoft, line: admin.primaryLine },
  attention: { fg: admin.attention, soft: admin.attentionSoft, line: admin.attentionLine },
  danger: { fg: admin.danger, soft: admin.dangerSoft, line: admin.dangerLine },
  neutral: { fg: admin.muted, soft: 'rgba(163,173,170,0.1)', line: admin.border },
};
