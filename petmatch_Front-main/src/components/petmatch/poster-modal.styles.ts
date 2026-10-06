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
      maxHeight: "92%",
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
      gap: 6,
    },
    topTitle: {
      fontWeight: "700",
      fontSize: 15,
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },

    // El Afiche en sí (Diseño Visual de Alto Impacto)
    posterPaper: {
      backgroundColor: "#FFFFFF",
      margin: 14,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: "#DC2626", // Rojo Alerta
      ...Platform.select({
        web: {
          boxShadow: "0 6px 18px rgba(220, 38, 38, 0.15)",
        },
        default: {
          elevation: 4,
          shadowColor: "#DC2626",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
      }),
    },
    posterHeader: {
      backgroundColor: "#DC2626",
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    headerBadge: {
      backgroundColor: "#FEF08A",
      paddingHorizontal: 12,
      paddingVertical: 3,
      borderRadius: 12,
      marginBottom: 4,
    },
    headerBadgeText: {
      color: "#991B1B",
      fontWeight: "900",
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    posterMainHeading: {
      color: "#FFFFFF",
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: 1.5,
      textAlign: "center",
    },
    posterSubheading: {
      color: "#FECACA",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
      marginTop: 2,
      textTransform: "uppercase",
    },

    // Foto de la Mascota
    photoSection: {
      position: "relative",
      backgroundColor: "#F3F4F6",
      height: 240,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderBottomWidth: 2,
      borderBottomColor: "#EF4444",
    },
    petPhoto: {
      width: "100%",
      height: "100%",
    },
    photoPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    urgentRibbon: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "#DC2626",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      ...Platform.select({
        web: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        },
      }),
    },
    urgentRibbonText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 11,
      letterSpacing: 0.5,
    },

    // Información Central
    posterBody: {
      padding: 16,
      alignItems: "center",
    },
    petName: {
      fontSize: 28,
      fontWeight: "900",
      color: "#111827",
      textAlign: "center",
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    detailsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      justifyContent: "center",
      marginBottom: 12,
    },
    badgeItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#F3F4F6",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    badgeText: {
      fontSize: 12,
      color: "#374151",
      fontWeight: "600",
    },
    badgeSpecial: {
      backgroundColor: "#FEF3C7",
      borderColor: "#FDE68A",
    },
    badgeSpecialText: {
      color: "#92400E",
    },
    descCard: {
      backgroundColor: "#F9FAFB",
      borderLeftWidth: 3,
      borderLeftColor: "#DC2626",
      padding: 10,
      borderRadius: 6,
      width: "100%",
      marginBottom: 14,
    },
    descText: {
      color: "#4B5563",
      fontSize: 13,
      lineHeight: 18,
      fontStyle: "italic",
    },

    // Caja de Contacto
    contactBox: {
      backgroundColor: "#25D366",
      width: "100%",
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          boxShadow: "0 4px 12px rgba(37, 211, 102, 0.35)",
        },
      }),
    },
    contactHelpText: {
      color: "#064E3B",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    contactPhoneRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    contactPhone: {
      color: "#FFFFFF",
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: 1,
    },

    // Pie de Afiche
    posterFooter: {
      backgroundColor: "#1F2937",
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerBrand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    footerBrandText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 12,
    },
    footerTagline: {
      color: "#9CA3AF",
      fontSize: 10,
      fontWeight: "500",
    },

    // Botones de Acción Fuera del Afiche
    actionButtonsRow: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 20,
      gap: 12,
    },
    downloadBtn: {
      backgroundColor: colors.tint,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    downloadBtnText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 15,
    },

    // Sección de Redes Sociales
    socialSection: {
      marginTop: 4,
      gap: 8,
    },
    socialHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    socialTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    socialGrid: {
      flexDirection: "row",
      gap: 8,
    },
    socialBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 11,
      borderRadius: 12,
      ...Platform.select({
        web: {
          transition: "transform 0.15s ease, opacity 0.15s ease",
        },
      }),
    },
    btnWhatsApp: {
      backgroundColor: "#25D366",
    },
    btnInstagram: {
      backgroundColor: "#E1306C",
    },
    btnFacebook: {
      backgroundColor: "#1877F2",
    },
    socialBtnText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 12,
    },
    utilityRow: {
      flexDirection: "row",
      gap: 8,
    },
    copyBtn: {
      flex: 1,
      backgroundColor: colors.cardMuted,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
    },
    copyBtnText: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 12,
    },
    nativeShareBtn: {
      flex: 1,
      backgroundColor: colors.cardMuted,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
    },
    nativeShareText: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 12,
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
  });
}
