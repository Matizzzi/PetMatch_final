import { Platform, StyleSheet } from "react-native";
import { Spacing } from "@/constants/theme";
import { ThemeColors } from "@/contexts/theme-context";

export function getSightingCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
      borderRadius: 22,
      padding: 14,
      borderWidth: 1.2,
      marginHorizontal: Spacing.three,
      marginVertical: Spacing.two,
      gap: Spacing.two + 2,
      overflow: "hidden",
      borderLeftWidth: 4,
      borderLeftColor: "#10B981", // Verde de avistamiento
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
        },
        android: { elevation: 3 },
        web: {
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.06)",
        } as any,
      }),
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.one,
    },
    sightingPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#10B98115",
      borderColor: "#10B981",
      borderWidth: 1.2,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 14,
      gap: 6,
    },
    sightingDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#10B981",
    },
    sightingText: {
      fontWeight: "800",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: "#10B981",
    },
    timeTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    timeText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    bodyRow: {
      flexDirection: "row",
      gap: Spacing.three,
      alignItems: "center",
    },
    photo: {
      width: 84,
      height: 84,
      borderRadius: 20,
      borderWidth: 1.2,
      borderColor: colors.border,
    },
    infoCol: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    title: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 1,
    },
    locationText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      flexShrink: 1,
    },
    description: {
      fontSize: 13,
      lineHeight: 18,
      marginTop: 2,
      color: colors.textSecondary,
    },
    witnessText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 2,
    },
    btnWhatsApp: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.whatsapp || "#25D366",
      paddingVertical: 10,
      borderRadius: 14,
      gap: 8,
      marginTop: 4,
    },
    btnWhatsAppText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 13,
    },
  });
}
