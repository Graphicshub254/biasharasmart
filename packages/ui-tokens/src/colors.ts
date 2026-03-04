
export const colors = {
  // Backgrounds
  ink:      '#0A0F1E',   // primary screen background
  navyDeep: '#003366',   // brand navy
  cobalt:   '#1565C0',   // interactive / primary CTA
  greyDark: '#455A64',   // secondary surface
  greyMid:  '#78909C',   // secondary text / labels
  grey1:    '#F5F7FA',   // light surface
  stripe:   '#EFF4FB',   // table stripe

  // Accents
  mint:     '#00BFA5',   // balance amount, success, progress
  teal:     '#00796B',   // M-Pesa green, payment confirmed
  tealLight:'#E0F2F1',   // teal surface

  // Semantic
  gold:     '#F9A825',   // warning, deadline approaching
  goldBg:   '#FFF8E1',
  green:    '#2E7D32',   // filed, compliant, approved
  greenBg:  '#E8F5E9',
  red:      '#C62828',   // lapsed, failed, danger
  redBg:    '#FFEBEE',
  orange:   '#E65100',   // overdue, needs attention
  orangeBg: '#FFF3E0',

  // Base
  white:    '#FFFFFF',
  black:    '#1A1A1A',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof colors;
