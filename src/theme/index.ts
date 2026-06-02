/**
 * CTK Alumni design system — a warm, regal "yearbook" palette built to
 * evoke reminiscence: aged-paper creams, deep heritage navy and antique gold.
 */

export const colors = {
  // Heritage navy — Christ the King regal tone
  navy: "#14213D",
  navyDeep: "#0C1730",
  navySoft: "#27355E",

  // Antique / wall-of-fame gold
  gold: "#C8A24B",
  goldSoft: "#E2C885",
  goldDeep: "#A07C2E",

  // Warm secondary (school-crest maroon)
  maroon: "#7B2D26",

  // Aged paper surfaces
  paper: "#FBF6EC",
  paperDim: "#F2EADC",
  card: "#FFFFFF",
  cardWarm: "#FFFDF8",

  // Ink
  ink: "#241F1A",
  inkSoft: "#5B5347",
  muted: "#8C8270",
  line: "#E7DECB",

  white: "#FFFFFF",
  success: "#3C7A57",
  danger: "#B0413E",

  // Overlay scrims for photos
  scrim: "rgba(12,23,48,0.55)",
  scrimSoft: "rgba(12,23,48,0.25)",
} as const;

export const fonts = {
  display: "PlayfairDisplay_700Bold",
  displayBlack: "PlayfairDisplay_900Black",
  displayItalic: "PlayfairDisplay_600SemiBold_Italic",
  serif: "PlayfairDisplay_500Medium",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  hand: "Caveat_600SemiBold", // nostalgic handwritten captions
  handBold: "Caveat_700Bold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const shadow = {
  soft: {
    shadowColor: "#3A2E14",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  lift: {
    shadowColor: "#1A1303",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },
} as const;

export const gradients = {
  hero: ["#0C1730", "#14213D", "#27355E"] as const,
  gold: ["#E2C885", "#C8A24B", "#A07C2E"] as const,
  scrim: ["transparent", "rgba(12,23,48,0.15)", "rgba(12,23,48,0.85)"] as const,
  paper: ["#FBF6EC", "#F2EADC"] as const,
};
