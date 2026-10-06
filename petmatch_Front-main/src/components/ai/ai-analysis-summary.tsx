import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import type { AnalisisIA } from "@/types/ai";
import type { IoniconName } from "@/types/ui";

function Atributo({ icon, label, valor }: { icon: IoniconName; label: string; valor: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={14} color={colors.tint} />
      <ThemedText type="small">
        <ThemedText type="smallBold">{label}:</ThemedText> {valor}
      </ThemedText>
    </View>
  );
}

/** Resumen morfológico devuelto por la IA (raza, pelaje, tamaño, collar, señas). */
export function AiAnalysisSummary({ analisis }: { analisis: AnalisisIA }) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.tint + "12", borderColor: colors.tint + "30" }]}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
        <ThemedText style={[styles.title, { color: colors.tint }]}>Análisis completado con IA</ThemedText>
      </View>

      <View style={styles.list}>
        {analisis.razaEstimada && <Atributo icon="sparkles-outline" label="Raza" valor={analisis.razaEstimada} />}
        {analisis.colorPelaje && (
          <Atributo icon="color-palette-outline" label="Pelaje" valor={analisis.colorPelaje} />
        )}
        {analisis.tamano && <Atributo icon="resize-outline" label="Tamaño" valor={analisis.tamano} />}

        <View style={styles.row}>
          <Ionicons
            name={analisis.usaCollar ? "checkmark-circle-outline" : "close-circle-outline"}
            size={14}
            color={analisis.usaCollar ? colors.tint : colors.textSecondary}
          />
          <ThemedText type="small">{analisis.usaCollar ? "Usa collar" : "Sin collar visible"}</ThemedText>
        </View>

        {analisis.senasParticulares && (
          <View style={styles.rowTop}>
            <Ionicons name="information-circle-outline" size={14} color={colors.tint} style={styles.iconTop} />
            <ThemedText type="small" style={styles.italic}>
              {analisis.senasParticulares}
            </ThemedText>
          </View>
        )}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Los campos del formulario se completaron automáticamente. Puedes editarlos si lo necesitas.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, gap: 8, borderWidth: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontWeight: "700", fontSize: 14 },
  list: { gap: 6, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTop: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 2 },
  iconTop: { marginTop: 2 },
  italic: { flex: 1, fontStyle: "italic" },
});
