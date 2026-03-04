
export const typography = {
  // Font families
  fontFamily: {
    primary: 'Inter',        // all UI text
    mono:    'JetBrainsMono', // KRA CU numbers, amounts in tables
  },

  // Font sizes (sp — scales with user accessibility settings)
  fontSize: {
    hero:    48,   // balance amount — one per screen
    title:   28,   // screen title, modal header
    heading: 22,   // card title, section header
    body:    16,   // body copy, descriptions
    label:   13,   // form labels, table column headers
    caption: 11,   // timestamps, fine print
    mono:    14,   // CU numbers, TIN, tabular amounts
  },

  // Font weights
  fontWeight: {
    black:    '900',
    bold:     '700',
    semibold: '600',
    medium:   '500',
    regular:  '400',
  },

  // Line heights
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },
} as const;
