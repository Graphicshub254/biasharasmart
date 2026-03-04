
export const spacing = {
  // Base unit: 4px
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl:64,

  // Touch targets (minimum 48pt per accessibility guidelines)
  touchTarget: 48,

  // Screen padding
  screenPadding: 16,

  // Card padding
  cardPadding: 20,

  // Border radius
  radius: {
    sm:   8,
    md:   12,
    lg:   16,
    xl:   24,
    full: 9999,
  },
} as const;
