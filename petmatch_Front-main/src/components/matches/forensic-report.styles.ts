import { StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";
import type { ThemeColors } from "@/contexts/theme-context";

/** Estilos del botón e informe de peritaje biométrico forense. */
export function getForensicReportStyles(colors: ThemeColors) {
  return StyleSheet.create({
    btnAnalisisForense: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.tint + "12",
      borderWidth: 1,
      borderColor: colors.tint + "35",
      marginTop: 4,
    },
    btnAnalisisForenseText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.tint,
    },
    forenseCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.tint + "30",
      backgroundColor: colors.backgroundElement,
      padding: Spacing.three,
      gap: 10,
      marginTop: 6,
    },
    forenseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    forenseTitleWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    forenseTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.2,
    },
    forenseBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
    },
    forenseBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    forenseResumen: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.text,
      backgroundColor: colors.cardMuted,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      fontStyle: "italic",
    },
    forenseRasgos: {
      gap: 8,
    },
    rasgoRow: {
      gap: 3,
    },
    rasgoHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rasgoNombre: {
      fontSize: 11.5,
      fontWeight: "600",
      color: colors.text,
    },
    rasgoScore: {
      fontSize: 11.5,
      fontWeight: "700",
      color: colors.tint,
    },
    rasgoBarBg: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.border + "80",
      overflow: "hidden",
    },
    rasgoBarFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: colors.tint,
    },
    rasgoObs: {
      fontSize: 11,
      lineHeight: 15,
      color: colors.textSecondary,
      marginTop: 1,
    },
    factoresCalleWrap: {
      gap: 4,
    },
    factoresTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.urgent,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    factoresPillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    factorPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: colors.urgent + "15",
      borderColor: colors.urgent + "30",
      borderWidth: 1,
    },
    factorPillText: {
      fontSize: 10.5,
      color: colors.urgent,
      fontWeight: "600",
    },
    recomBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      backgroundColor: colors.whatsapp + "15",
      borderColor: colors.whatsapp + "35",
      borderWidth: 1,
      padding: 8,
      borderRadius: 10,
    },
    recomText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
      color: colors.text,
    },
  });
}
