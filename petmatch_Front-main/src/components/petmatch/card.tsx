import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { AlertaPerdida } from "@/types/api";
import { resolveFotoUrl } from "@/services/api";
import { getCardStyles } from "./card.styles";

function tiempoRelativo(fechaISO: string): string {
  const dias = Math.floor(
    (Date.now() - new Date(fechaISO).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Hace 1 d";
  return `Hace ${dias} d`;
}

interface PetCardProps {
  alerta: AlertaPerdida;
  matchesCount?: number;
  onWhatsApp?: (numero: string, nombre: string) => void;
  onShare?: (alerta: AlertaPerdida) => void;
  onViewMatches?: (alerta: AlertaPerdida) => void;
  onGenerarAfiche?: (alerta: AlertaPerdida) => void;
}

export function PetCard({
  alerta,
  matchesCount,
  onWhatsApp,
  onShare,
  onViewMatches,
  onGenerarAfiche,
}: PetCardProps) {
  const { colors } = useAppTheme();
  const styles = getCardStyles(colors, alerta.urgente);

  const mascota = alerta.mascota;
  const especieLabel =
    mascota.especie.charAt(0).toUpperCase() + mascota.especie.slice(1).toLowerCase();

  return (
    <View style={styles.card}>
      {/* 1. Header con Badges */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          {!alerta.activa ? (
            <View style={styles.resolvedPill}>
              <Ionicons name="checkmark-circle" size={13} color="#065F46" />
              <ThemedText style={styles.resolvedPillText}>
                Reencontrado
              </ThemedText>
            </View>
          ) : alerta.urgente ? (
            <View style={styles.urgentPill}>
              <View style={styles.urgentDot} />
              <ThemedText type="small" style={styles.urgentText}>
                Urgente
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.speciesPill}>
            <ThemedText type="small" style={styles.speciesText}>
              {especieLabel}
            </ThemedText>
          </View>
        </View>

        <View style={styles.timeTag}>
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
          <ThemedText type="small" style={styles.timeText}>
            {tiempoRelativo(alerta.fechaPerdida || alerta.createdAt)}
          </ThemedText>
        </View>
      </View>

      {/* 2. Cuerpo Principal: Foto + Detalles */}
      <View style={styles.bodyRow}>
        {resolveFotoUrl(mascota.fotoUrl) ? (
          <Image
            source={{ uri: resolveFotoUrl(mascota.fotoUrl)! }}
            style={styles.photo}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="paw-outline" size={32} color={colors.tint} />
          </View>
        )}

        <View style={styles.infoCol}>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.petName}>
            {mascota.nombre}
          </ThemedText>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color={colors.tint} />
            <ThemedText
              type="small"
              numberOfLines={1}
              style={styles.locationText}
            >
              {alerta.sector ?? "Melipilla"}
            </ThemedText>
          </View>

          {mascota.descripcion ? (
            <ThemedText
              type="small"
              numberOfLines={2}
              style={styles.description}
            >
              {mascota.descripcion}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {/* 3. Atributos (Chips minimalistas, Collar, etc.) */}
      <View style={styles.tagsRow}>
        {mascota.usaCollar && (
          <View style={styles.miniTag}>
            <Ionicons name="pricetag-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
            <ThemedText type="small" style={styles.miniTagText}>
              Collar
            </ThemedText>
          </View>
        )}

        {mascota.tieneChip && (
          <View style={styles.miniTag}>
            <Ionicons name="hardware-chip-outline" size={11} color={colors.textSecondary} style={{ marginRight: 3 }} />
            <ThemedText type="small" style={styles.miniTagText}>
              Microchip
            </ThemedText>
          </View>
        )}

        {mascota.condicionMedica ? (
          <View style={styles.miniTagMedical}>
            <Ionicons name="medkit-outline" size={11} color="#E65100" style={{ marginRight: 3 }} />
            <ThemedText type="small" style={[styles.miniTagText, { color: "#E65100" }]}>
              Cuidados
            </ThemedText>
          </View>
        ) : null}
      </View>

      {/* 4. Barra de Acciones Responsiva */}
      <View style={styles.actionRow}>
        {alerta.whatsapp ? (
          <Pressable
            onPress={() => onWhatsApp?.(alerta.whatsapp!, mascota.nombre)}
            style={({ pressed }) => [
              styles.btnWhatsApp,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
            <ThemedText numberOfLines={1} style={styles.btnWhatsAppText}>
              WhatsApp
            </ThemedText>
          </Pressable>
        ) : (
          <View style={styles.noContactWrap}>
            <ThemedText type="small" numberOfLines={1} themeColor="textSecondary">
              Sin WhatsApp
            </ThemedText>
          </View>
        )}

        {onViewMatches && (
          <Pressable
            onPress={() => onViewMatches(alerta)}
            style={({ pressed }) => [
              styles.btnMatches,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="sparkles" size={14} color={colors.tint} />
            <ThemedText numberOfLines={1} style={styles.btnMatchesText}>
              Matches{matchesCount && matchesCount > 0 ? ` (${matchesCount})` : ""}
            </ThemedText>
          </Pressable>
        )}

        {onGenerarAfiche && (
          <Pressable
            onPress={() => onGenerarAfiche(alerta)}
            style={({ pressed }) => [
              styles.btnAfiche,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="megaphone-outline" size={14} color="#DC2626" />
            <ThemedText numberOfLines={1} style={styles.btnAficheText}>
              Afiche
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}
