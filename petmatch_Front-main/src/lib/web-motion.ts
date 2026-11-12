import { Platform, type ViewStyle } from "react-native";

/** Clases de `global.css` solo en web (hover, fade-in). */
export function webClass(...names: Array<string | false | undefined>): Record<string, unknown> {
  if (Platform.OS !== "web") return {};
  const className = names.filter(Boolean).join(" ");
  return className ? { className } : {};
}

export function webDelay(index = 0): ViewStyle | undefined {
  if (Platform.OS !== "web") return undefined;
  return { animationDelay: `${Math.min(index, 14) * 40}ms` } as ViewStyle;
}

export const pressScale = (pressed: boolean) => ({
  transform: [{ scale: pressed ? 0.98 : 1 }],
  opacity: pressed ? 0.92 : 1,
});
