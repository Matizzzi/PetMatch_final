import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { getMatchesModalStyles } from "./matches-modal.styles";

export function MatchesLoading() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(getMatchesModalStyles);
  return (
    <View style={styles.centerBox}>
      <ActivityIndicator size="large" color={colors.tint} />
      <ThemedText themeColor="textSecondary" style={{ marginTop: 12 }}>
        Cruzando datos geográficos y temporales...
      </ThemedText>
    </View>
  );
}

export function MatchesError({ message }: { message: string }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(getMatchesModalStyles);
  return (
    <View style={styles.centerBox}>
      <Ionicons name="alert-circle-outline" size={40} color={colors.urgent} />
      <ThemedText style={{ color: colors.urgent, marginTop: 8 }}>{message}</ThemedText>
    </View>
  );
}

export function MatchesEmpty({ sector }: { sector?: string | null }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(getMatchesModalStyles);
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
      </View>
      <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
        Sin avistamientos coincidentes por ahora
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="small" style={styles.emptyText}>
        Cuando alguien reporte en la pestaña “Reportar” un animal con la misma especie y cerca de{" "}
        {sector ?? "tu zona"}, aparecerá aquí de inmediato.
      </ThemedText>
    </View>
  );
}

/** Banner que explica la ponderación del algoritmo de matching. */
export function MatchesSummary({ total }: { total: number }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(getMatchesModalStyles);
  return (
    <View style={styles.summaryBanner}>
      <Ionicons name="calculator-outline" size={20} color={colors.tint} />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText style={styles.summaryTitle}>
          {total} coincidencia(s) detectadas por el algoritmo
        </ThemedText>
        <ThemedText style={styles.summaryHint}>
          Ponderación real: 55% Distancia (Fórmula de Haversine) + 25% Proximidad temporal + 20%
          Rasgos clave.
        </ThemedText>
      </View>
    </View>
  );
}
