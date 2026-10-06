import { Platform, StyleSheet } from "react-native";
import { Spacing } from "@/constants/theme";
import { ThemeColors } from "@/contexts/theme-context";

export function getHomeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
      width: "100%",
      maxWidth: 640,
    },
    flatList: {
      width: "100%",
    },
    flatListContent: {
      paddingBottom: 200,
    },
    headerSection: {
      gap: Spacing.two,
    },
    headerBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: Spacing.four,
      marginTop: Spacing.two,
      marginBottom: Spacing.one,
      paddingHorizontal: Spacing.four,
      paddingVertical: 14,
      borderRadius: 22,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: "#0F172A",
          shadowOpacity: 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 2 },
        web: {
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
        } as any,
      }),
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.two,
    },
    logoCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.tint,
    },
    brandTitle: {
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3,
      color: colors.text,
    },
    locationPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    locationLabel: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.two,
    },
    urgentCounter: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: colors.urgent + "15",
      borderColor: colors.urgent,
    },
    urgentCounterText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.urgent,
    },
    themeToggle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSelected,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: Spacing.four,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 11 : 7,
      borderRadius: 18,
      borderWidth: 1,
      gap: 10,
      backgroundColor: colors.backgroundElement,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      padding: 0,
      color: colors.text,
    },
    clearBtn: {
      padding: 2,
    },
    mapWrap: {
      paddingHorizontal: Spacing.four,
    },
    listTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: Spacing.four,
      marginTop: Spacing.two,
      marginBottom: Spacing.one,
      gap: Spacing.one,
    },
    accentIndicator: {
      width: 4,
      height: 16,
      borderRadius: 2,
      backgroundColor: colors.tint,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    resultsBadge: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.four,
      gap: Spacing.two,
    },
    securityBanner: {
      marginHorizontal: Spacing.four,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    securityIconWrap: {
      backgroundColor: "#FEF3C7",
      padding: 7,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    securityTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#92400E",
    },
    securityDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
      marginTop: 2,
    },
    securityCloseBtn: {
      padding: 2,
    },
  });
}
