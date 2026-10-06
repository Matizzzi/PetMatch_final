import { StyleSheet } from "react-native";
import { ThemeColors } from "@/contexts/theme-context";

export function getMapStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      marginVertical: 8,
    },
    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 14,
      marginBottom: 6,
      paddingHorizontal: 4,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    mapContainer: {
      height: 260,
      borderRadius: 24,
      borderWidth: 1.2,
      borderColor: colors.border,
      backgroundColor: colors.backgroundElement,
      overflow: "hidden",
    },
    iframe: {
      width: "100%",
      height: "100%",
      border: "none",
      borderRadius: 24,
    } as any,
  });
}
