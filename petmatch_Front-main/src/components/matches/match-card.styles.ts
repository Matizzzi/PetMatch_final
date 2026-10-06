import { StyleSheet } from "react-native";

import { Spacing } from "@/constants/theme";
import type { ThemeColors } from "@/contexts/theme-context";

/** Estilos de la tarjeta de match: puntaje, comparación de fotos, detalles y acciones. */
export function getMatchCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
    matchCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: Spacing.three,
      gap: Spacing.three,
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
    },
    matchScoreBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    scoreBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1.2,
    },
    scoreTrack: {
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
      marginTop: -2,
      marginBottom: 4,
      backgroundColor: colors.border + "60",
    },
    scoreFill: {
      height: "100%",
      borderRadius: 3,
    },
    metricsRow: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 2,
    },
    metricItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.backgroundSelected,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    metricText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.tint,
    },
    photosComparison: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    photoCol: {
      flex: 1,
      alignItems: "stretch",
      gap: 4,
    },
    photoLabel: {
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
    },
    comparePhoto: {
      width: "100%",
      height: 120,
      borderRadius: 12,
      backgroundColor: colors.backgroundSelected,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vsBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#1F2A2E",
      alignItems: "center",
      justifyContent: "center",
    },
    vsText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
    },
    matchDetails: {
      gap: 6,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    routeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1.2,
      borderColor: colors.tint + "50",
      backgroundColor: colors.tint + "10",
      marginTop: 4,
    },
    routeBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.tint,
    },
    contactBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: Spacing.three,
      borderRadius: 14,
      marginTop: 4,
      backgroundColor: colors.whatsapp || "#25D366",
    },
    contactBtnText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },
    noPhoneInfo: {
      alignItems: "center",
      paddingVertical: 6,
    },
  });
}
