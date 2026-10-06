import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { SemanticColors } from "@/constants/petmatch";
import { nivelVisible, requiereAtencion } from "@/lib/triage";
import type { NivelUrgencia, TriajeIA } from "@/types/ai";
import type { IoniconName } from "@/types/ui";

const PRESENTACION: Record<NivelUrgencia, { color: string; icon: IoniconName; titulo: string }> = {
  ALTA: { color: SemanticColors.danger, icon: "medkit", titulo: "Alerta de Bienestar: urgencia ALTA" },
  MEDIA: { color: SemanticColors.warning, icon: "warning", titulo: "Alerta de Bienestar: urgencia MEDIA" },
  BAJA: { color: SemanticColors.safe, icon: "shield-checkmark", titulo: "Triaje: sin signos de urgencia" },
};

/** Tarjeta de triaje veterinario: rojo (ALTA), ámbar (MEDIA) o verde (BAJA). */
export function AiTriageBadge({ triaje }: { triaje: TriajeIA }) {
  const { color, icon, titulo } = PRESENTACION[nivelVisible(triaje)];
  const { condicionCorporal, lesionesVisibles, descripcionLesiones } = triaje;

  return (
    <View
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor: color + "14", borderColor: color }]}
    >
      <View style={styles.row}>
        <Ionicons name={icon} size={20} color={color} />
        <ThemedText style={[styles.title, { color }]}>{titulo}</ThemedText>
      </View>

      {condicionCorporal && (
        <View style={styles.row}>
          <Ionicons name="body-outline" size={14} color={color} />
          <ThemedText type="small" style={styles.flex}>
            <ThemedText type="smallBold">Condición corporal:</ThemedText> {condicionCorporal.puntaje}/5 ·{" "}
            {condicionCorporal.descripcion}
          </ThemedText>
        </View>
      )}

      <View style={styles.rowTop}>
        <Ionicons
          name={lesionesVisibles ? "bandage-outline" : "checkmark-circle-outline"}
          size={14}
          color={color}
          style={styles.iconTop}
        />
        <ThemedText type="small" style={styles.flex}>
          <ThemedText type="smallBold">Lesiones:</ThemedText>{" "}
          {lesionesVisibles ? descripcionLesiones || "Detectadas" : "No se observan lesiones visibles"}
        </ThemedText>
      </View>

      {requiereAtencion(triaje) && (
        <ThemedText type="small" themeColor="textSecondary">
          Se marcó como urgente y se completó la condición médica automáticamente. Este triaje es
          orientativo; consulta a un veterinario.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, gap: 8, borderWidth: 1.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTop: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  iconTop: { marginTop: 2 },
  title: { fontWeight: "700", fontSize: 14, flex: 1 },
  flex: { flex: 1 },
});
