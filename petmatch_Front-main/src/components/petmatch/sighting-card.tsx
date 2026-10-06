import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Linking, Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { ReporteAvistamiento } from "@/types/api";
import { resolveFotoUrl } from "@/services/api";
import { getSightingCardStyles } from "./sighting-card.styles";

function tiempoRelativo(fechaISO: string): string {
  const diffMs = Date.now() - new Date(fechaISO).getTime();
  const minutos = Math.floor(diffMs / (1000 * 60));
  if (minutos < 60) return `Hace ${Math.max(1, minutos)} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias} d`;
}

interface SightingCardProps {
  avistamiento: ReporteAvistamiento;
}

export function SightingCard({ avistamiento }: SightingCardProps) {
  const { colors } = useAppTheme();
  const styles = getSightingCardStyles(colors);

  const especieFormat =
    avistamiento.especie.charAt(0).toUpperCase() +
    avistamiento.especie.slice(1).toLowerCase();

  const contactar = () => {
    if (!avistamiento.contactoTelefono) return;
    const limpio = avistamiento.contactoTelefono.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hola! Vi tu reporte de avistamiento en PetMatch sobre un ${avistamiento.especie}. ¿Me podrías dar más información?`
    );
    Linking.openURL(`https://wa.me/${limpio}?text=${msg}`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.sightingPill}>
            <View style={styles.sightingDot} />
            <ThemedText type="small" style={styles.sightingText}>
              {especieFormat}
            </ThemedText>
          </View>
        </View>

        <View style={styles.timeTag}>
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
          <ThemedText type="small" style={styles.timeText}>
            {tiempoRelativo(avistamiento.fechaAvistamiento || avistamiento.createdAt)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.bodyRow}>
        {avistamiento.fotoUrl ? (
          <Image
            source={{ uri: resolveFotoUrl(avistamiento.fotoUrl)! }}
            style={styles.photo}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[styles.photo, { alignItems: "center", justifyContent: "center", backgroundColor: colors.backgroundSelected }]}>
            <Ionicons name="eye-outline" size={28} color={colors.tint} />
          </View>
        )}

        <View style={styles.infoCol}>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.title}>
            Avistamiento Callejero
          </ThemedText>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color="#10B981" />
            <ThemedText
              type="small"
              numberOfLines={1}
              style={styles.locationText}
            >
              {avistamiento.comuna || "Melipilla"}
            </ThemedText>
          </View>

          <ThemedText
            type="small"
            numberOfLines={2}
            style={styles.description}
          >
            "{avistamiento.descripcion}"
          </ThemedText>

          {avistamiento.contactoNombre && (
            <ThemedText type="small" style={styles.witnessText}>
              Testigo: {avistamiento.contactoNombre}
            </ThemedText>
          )}
        </View>
      </View>

      {avistamiento.contactoTelefono && (
        <Pressable
          onPress={contactar}
          style={({ pressed }) => [
            styles.btnWhatsApp,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
          <ThemedText style={styles.btnWhatsAppText}>
            Contactar a testigo ({avistamiento.contactoTelefono})
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}
