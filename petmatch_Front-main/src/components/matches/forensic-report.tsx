import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { anchoBarra, colorRasgo, paletaVeredicto } from "@/lib/score-colors";
import type { InformeForense } from "@/types/ai";
import { getForensicReportStyles } from "./forensic-report.styles";

interface ForensicTriggerProps {
  cargando: boolean;
  onPress: () => void;
}

/** Botón que solicita el peritaje biométrico con IA. */
export function ForensicTrigger({ cargando, onPress }: ForensicTriggerProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(getForensicReportStyles);

  return (
    <Pressable style={styles.btnAnalisisForense} onPress={onPress} disabled={cargando} accessibilityRole="button">
      {cargando ? (
        <ActivityIndicator size="small" color={colors.tint} />
      ) : (
        <Ionicons name="sparkles" size={15} color={colors.tint} />
      )}
      <ThemedText style={styles.btnAnalisisForenseText}>
        {cargando
          ? "Analizando biometría y rasgos de calle con IA..."
          : "Ver Peritaje Biométrico con IA (Morfología y Calle)"}
      </ThemedText>
    </Pressable>
  );
}

/** Informe pericial: veredicto, resumen, rasgos, factores de calle y recomendación. */
export function ForensicReport({ informe }: { informe: InformeForense }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(getForensicReportStyles);
  const paleta = paletaVeredicto(informe.veredicto, colors);
  const factores = informe.factoresCalle ?? [];

  return (
    <View style={styles.forenseCard}>
      <View style={styles.forenseHeader}>
        <View style={styles.forenseTitleWrap}>
          <Ionicons name="finger-print-outline" size={18} color={colors.tint} />
          <ThemedText style={styles.forenseTitle}>Peritaje Biométrico Forense</ThemedText>
        </View>
        <View style={[styles.forenseBadge, { backgroundColor: paleta.fondo, borderColor: paleta.borde }]}>
          <ThemedText style={[styles.forenseBadgeText, { color: paleta.texto }]}>
            {informe.veredicto} ({informe.porcentajeBiometrico}%)
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.forenseResumen}>&quot;{informe.resumenEjecutivo}&quot;</ThemedText>

      <View style={styles.forenseRasgos}>
        {informe.rasgosAnalizados.map((rasgo, i) => (
          <View key={`${i}-${rasgo.nombre}`} style={styles.rasgoRow}>
            <View style={styles.rasgoHeader}>
              <ThemedText style={styles.rasgoNombre}>{rasgo.nombre}</ThemedText>
              <ThemedText style={styles.rasgoScore}>{rasgo.porcentaje}%</ThemedText>
            </View>
            <View style={styles.rasgoBarBg}>
              <View
                style={[
                  styles.rasgoBarFill,
                  { width: anchoBarra(rasgo.porcentaje), backgroundColor: colorRasgo(rasgo.porcentaje, colors) },
                ]}
              />
            </View>
            <ThemedText style={styles.rasgoObs}>{rasgo.observacion}</ThemedText>
          </View>
        ))}
      </View>

      {factores.length > 0 && (
        <View style={styles.factoresCalleWrap}>
          <ThemedText style={styles.factoresTitle}>Alteraciones por Estado de Calle Detectadas:</ThemedText>
          <View style={styles.factoresPillRow}>
            {factores.map((factor, i) => (
              <View key={`${i}-${factor}`} style={styles.factorPill}>
                <Ionicons name="warning-outline" size={12} color={colors.urgent} />
                <ThemedText style={styles.factorPillText}>{factor}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {informe.recomendacion && (
        <View style={styles.recomBox}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.whatsapp} style={{ marginTop: 1 }} />
          <ThemedText style={styles.recomText}>
            <ThemedText style={{ fontWeight: "700" }}>Recomendación Pericial: </ThemedText>
            {informe.recomendacion}
          </ThemedText>
        </View>
      )}
    </View>
  );
}
