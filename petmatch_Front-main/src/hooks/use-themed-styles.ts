import { useMemo } from "react";

import { type ThemeColors, useAppTheme } from "@/contexts/theme-context";

/** Memoiza una fábrica de estilos dependiente del tema activo. */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useAppTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
