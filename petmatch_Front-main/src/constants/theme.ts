import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0F172A",
    background: "#F8FAFC",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#EEF2FF",
    textSecondary: "#64748B",
    tint: "#4F46E5",
    urgent: "#EF4444",
    border: "#E2E8F0",
    whatsapp: "#10B981",
    cardMuted: "#F1F5F9",
  },
  dark: {
    text: "#F8FAFC",
    background: "#090D16",
    backgroundElement: "#111827",
    backgroundSelected: "#1E1B4B",
    textSecondary: "#94A3B8",
    tint: "#6366F1",
    urgent: "#F87171",
    border: "#1E293B",
    whatsapp: "#10B981",
    cardMuted: "#0F172A",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: "System", serif: "System", rounded: "System", mono: "Menlo" },
  default: {
    sans: "normal",
    serif: "normal",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui",
    serif: "system-ui",
    rounded: "system-ui",
    mono: "monospace",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const FloatingTabBarHeight = 88;
export const MaxContentWidth = 800;
