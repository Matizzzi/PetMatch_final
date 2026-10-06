import { useAppTheme } from "@/contexts/theme-context";

export function useTheme() {
  const { colors } = useAppTheme();
  return colors;
}
