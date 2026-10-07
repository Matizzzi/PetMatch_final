import { StyleSheet, Platform } from "react-native";
import { ThemeColor } from "@/constants/theme";

export function getPosterModalStyles(colors: Record<ThemeColor, string>) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    scrollWrap: {
      width: "100%",
      maxWidth: 440,
      maxHeight: "94%",
    },
    scrollContent: {
      paddingBottom: 24,
    },
    modalContainer: {
      backgroundColor: colors.backgroundElement,
      borderRadius: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        web: {
          boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
        },
        default: {
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
      }),
    },
    topActionsBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.cardMuted,
    },
    topTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    topTitle: {
      fontWeight: "700",
      fontSize: 15,
      color: colors.text,
    },
    topSubtitle: {
      fontSize: 11,
      lineHeight: 14,
      color: colors.textSecondary,
    },
    closeButton: {
      padding: 4,
    },

    previewWrap: {
      alignItems: "center",
      paddingVertical: 16,
    },
    previewFrame: {
      borderRadius: 14,
      overflow: "hidden",
      ...Platform.select({
        web: {
          boxShadow: "0 8px 24px rgba(220, 38, 38, 0.25)",
        },
        default: {
          elevation: 6,
          shadowColor: "#DC2626",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
      }),
    },

    actions: {
      paddingHorizontal: 16,
      paddingBottom: 20,
      gap: 10,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    downloadBtn: {
      backgroundColor: colors.tint,
    },
    whatsappBtn: {
      backgroundColor: "#25D366",
    },
    actionBtnText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 15,
    },
    hintText: {
      fontSize: 12,
      textAlign: "center",
      color: colors.textSecondary,
    },
    noticeBanner: {
      backgroundColor: "#ECFDF5",
      borderWidth: 1,
      borderColor: "#A7F3D0",
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    noticeText: {
      color: "#065F46",
      fontSize: 12,
      fontWeight: "600",
      flex: 1,
    },
    noticeError: {
      backgroundColor: "#FEF2F2",
      borderColor: "#FECACA",
    },
    noticeErrorText: {
      color: "#991B1B",
    },
  });
}
