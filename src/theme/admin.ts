/**
 * Admin console theme: "teal header". A light console with a bold logo-teal band across the top
 * and white cards below. Built from the logo's teal (#0AB49A) and amber (#FEA923).
 *
 * Semantic tokens only (the gluestack-ui rule): screens ask for `card`, `primary`, `attention`…,
 * never raw hex values, so the palette can be retuned in one place.
 *
 * Contrast (UI/UX Pro Max checklist): the bright logo teal and amber are too light for small text
 * on white, so they are used for fills (band, highlights, avatars, buttons), while text and icons
 * use deeper shades of the same hues (`primaryText`, `attentionText`), which pass 4.5:1 on white.
 *
 * Roles:
 *  - teal band → the header area of every admin screen (AdminScreen in components/admin/kit.tsx)
 *  - white     → cards, inputs, tab bar and sidebar, on a pale teal-tinted background
 *  - teal      → the one action/success colour (primary buttons, active nav, approved)
 *  - amber     → attention only (pending reviews, counts that need action)
 */
export const admin = {
  // Header band (logo teal, slightly deepened at the bottom so white text stays readable)
  band: ['#0AB49A', '#079A84'] as const,
  onBand: '#FFFFFF',
  onBandMuted: 'rgba(255,255,255,0.9)',
  onBandSoft: 'rgba(255,255,255,0.2)',

  // Surfaces
  background: '#EEF8F6',
  card: '#FFFFFF',
  cardRaised: '#F3F9F8',
  /** Top edge of cards. */
  edge: '#DCEDEA',
  border: '#DCEDEA',
  bar: '#FFFFFF',

  // Text
  foreground: '#0F1F1C',
  muted: '#55655F',
  subtle: '#687873',

  // Logo teal
  primary: '#0AB49A',
  /** Teal for text and icons on white. */
  primaryText: '#078A76',
  /** Primary buttons: deeper teal sheen so white labels stay readable. */
  primaryGradient: ['#0AA68E', '#078A76'] as const,
  primaryForeground: '#FFFFFF',
  primarySoft: 'rgba(10,180,154,0.12)',
  primaryLine: 'rgba(10,180,154,0.4)',

  // Logo amber
  attention: '#FEA923',
  /** Amber for text and icons on white. */
  attentionText: '#A35F00',
  attentionForeground: '#1A1205',
  attentionSoft: 'rgba(254,169,35,0.16)',
  attentionLine: 'rgba(230,150,20,0.55)',

  // Destructive (the only non-logo colour; used for reject / suspend)
  danger: '#C8383D',
  dangerSoft: 'rgba(200,56,61,0.09)',
  dangerLine: 'rgba(200,56,61,0.4)',

  pressed: 'rgba(15,31,28,0.05)',
  /** Soft card lift on the light background. */
  shadow: '#0A5046',
} as const;

export type AdminTone = 'primary' | 'attention' | 'danger' | 'neutral';

/** Colours for a tone: `fg` for text/icons, `soft` backgrounds, `line` borders, `fill` for solid shapes. */
export const toneColors: Record<AdminTone, { fg: string; soft: string; line: string; fill: string }> = {
  primary: { fg: admin.primaryText, soft: admin.primarySoft, line: admin.primaryLine, fill: admin.primary },
  attention: { fg: admin.attentionText, soft: admin.attentionSoft, line: admin.attentionLine, fill: admin.attention },
  danger: { fg: admin.danger, soft: admin.dangerSoft, line: admin.dangerLine, fill: admin.danger },
  neutral: { fg: admin.muted, soft: '#EFF5F4', line: admin.border, fill: admin.muted },
};
