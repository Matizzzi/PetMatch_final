import { StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";
import type { ThemeColors } from "@/contexts/theme-context";

/** Estilos del bottom sheet contenedor y de sus estados (carga, error, vacío). */
export function getMatchesModalStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      maxHeight: "88%",
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderWidth: 1,
      paddingTop: Spacing.two,
      paddingBottom: Spacing.six,
    },
    dragHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: Spacing.two,
      marginTop: Spacing.one,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.four,
      paddingBottom: Spacing.three,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundElement,
      alignItems: "center",
      justifyContent: "center",
    },
    centerBox: {
      padding: Spacing.six,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyBox: {
      padding: Spacing.six,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.two,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.backgroundElement,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.two,
    },
    emptyText: {
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: 20,
    },
    matchesList: {
      paddingHorizontal: Spacing.four,
      gap: Spacing.three,
      paddingBottom: Spacing.four,
    },
    summaryBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: Spacing.three,
      borderRadius: 12,
      backgroundColor: colors.tint + "15",
    },
    summaryTitle: {
      color: colors.tint,
      fontSize: 13,
      fontWeight: "700",
    },
    summaryHint: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 15,
    },
  });
}
