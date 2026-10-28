// RennovaAI design tokens — colours sampled directly from the brand logo.
//  Teal  #0AB49A  → trust & freshness (house outline)
//  Navy  #00275B  → professionalism (wordmark)
//  Amber #FEA923  → warmth & creativity (AI sparkle)

export const colors = {
  teal: '#0AB49A',
  tealDark: '#078A76',
  tealDeep: '#10766E',
  tealSoft: '#E6F7F4',
  tealMist: '#F2FAF8',

  navy: '#00275B',
  navyDeep: '#0B1E3F',
  navySoft: '#E8EDF5',

  amber: '#FEA923',
  amberDark: '#E08E0B',
  amberSoft: '#FFF4E0',

  white: '#FFFFFF',
  bg: '#F7F9FB',
  card: '#FFFFFF',
  border: '#E3E8EF',
  text: '#0B1E3F',
  textMuted: '#5B6B82',
  textSubtle: '#8A97AB',

  success: '#16A34A',
  danger: '#DC2626',
  overlay: 'rgba(0, 39, 91, 0.55)',
} as const;

export const fonts = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extrabold: 'Montserrat_800ExtraBold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: '#0B1E3F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0B1E3F',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;
