/** Design tokens mirrored from pulse-web/src/styles/index.css. */
export const colors = {
  base: '#0a0a0e',
  surface: '#121219',
  raised: '#1a1a23',
  overlay: '#262631',
  line: '#23232e',
  fg: '#f5f5f7',
  muted: '#a7a7b4',
  faint: '#8b8b98',
  accent: '#1ee06f',
  accentDeep: '#11b457',
  accentInk: '#04230f',
  violet: '#8b7cff',
  danger: '#ff5a5a',
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const type = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8 },
  title: { fontSize: 23, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodySm: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pop: {
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  accent: {
    shadowColor: '#1ee06f',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
} as const;
