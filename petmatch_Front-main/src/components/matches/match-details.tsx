import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { urlWhatsAppTestigo } from "@/lib/format";
import { urlRutaGoogleMaps } from "@/lib/geo";
import type { AlertaPerdida, ReporteAvistamiento } from "@/types/api";
import { getMatchCardStyles } from "./match-card.styles";

interface MatchDetailsProps {
  alerta: AlertaPerdida;
  avistamiento: ReporteAvistamiento;
}

/** Lugar, descripción y testigo del avistamiento + acciones de ruta y contacto. */
export function MatchDetails({ alerta, avistamiento: av }: MatchDetailsProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(getMatchCardStyles);

  return (
    <>
      <View style={styles.matchDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={15} color={colors.tint} />
          <ThemedText type="small" style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold">Lugar: </ThemedText>
            {av.comuna || "Sector reportado"}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="chatbox-ellipses-outline" size={15} color={colors.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
            &quot;{av.descripcion}&quot;
          </ThemedText>
        </View>
        {av.contactoNombre && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Testigo: {av.contactoNombre}
            </ThemedText>
          </View>
        )}
      </View>

      <Pressable
        style={styles.routeBtn}
        accessibilityRole="link"
        onPress={() => Linking.openURL(urlRutaGoogleMaps(alerta, av))}
      >
        <Ionicons name="navigate-outline" size={14} color={colors.tint} />
        <ThemedText style={styles.routeBtnText}>Ver ruta en mapa entre ambos puntos</ThemedText>
      </Pressable>

      {av.contactoTelefono ? (
        <Pressable
          style={styles.contactBtn}
          accessibilityRole="link"
          onPress={() => Linking.openURL(urlWhatsAppTestigo(av.contactoTelefono!, alerta.mascota.nombre))}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <ThemedText style={styles.contactBtnText}>
            Contactar a quien lo vio ({av.contactoTelefono})
          </ThemedText>
        </Pressable>
      ) : (
        <View style={styles.noPhoneInfo}>
          <ThemedText type="small" themeColor="textSecondary">
            El testigo no dejó teléfono público.
          </ThemedText>
        </View>
      )}
    </>
  );
}
