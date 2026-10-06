import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { SemanticColors } from "@/constants/petmatch";
import { useAppTheme } from "@/contexts/theme-context";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { formatearFecha } from "@/lib/format";
import { formatearDistancia } from "@/lib/geo";
import { anchoBarra, colorScoreMatch } from "@/lib/score-colors";
import type { AlertaPerdida, Match, ReporteAvistamiento } from "@/types/api";
import { getMatchCardStyles } from "./match-card.styles";

interface MatchScoreHeaderProps {
  match: Match;
  alerta: AlertaPerdida;
  avistamiento: ReporteAvistamiento;
}

/** Puntaje total, barra de progreso y desglose distancia / tiempo / rasgos. */
export function MatchScoreHeader({ match, alerta, avistamiento }: MatchScoreHeaderProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(getMatchCardStyles);
  const scoreColor = colorScoreMatch(match.scoreTotal, colors);

  return (
    <>
      <View style={styles.matchScoreBar}>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "20", borderColor: scoreColor }]}>
          <Ionicons name="checkmark-circle" size={15} color={scoreColor} />
          <ThemedText type="small" style={{ color: scoreColor, fontWeight: "800" }}>
            {Math.round(match.scoreTotal)}% Coincidencia
          </ThemedText>
        </View>
        <ThemedText themeColor="textSecondary" type="small">
          {formatearFecha(avistamiento.fechaAvistamiento || avistamiento.createdAt)}
        </ThemedText>
      </View>

      <View style={styles.scoreTrack}>
        <View
          style={[styles.scoreFill, { width: anchoBarra(match.scoreTotal, 15), backgroundColor: scoreColor }]}
        />
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Ionicons name="location" size={13} color={colors.tint} />
          <ThemedText style={styles.metricText}>{formatearDistancia(alerta, avistamiento)}</ThemedText>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="time" size={13} color={SemanticColors.warning} />
          <ThemedText style={[styles.metricText, { color: SemanticColors.warningText }]}>
            {match.scoreTiempo >= 90 ? "Mismo día" : `Tiempo: ${Math.round(match.scoreTiempo)}%`}
          </ThemedText>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="sparkles" size={13} color={SemanticColors.success} />
          <ThemedText style={[styles.metricText, { color: SemanticColors.successText }]}>
            Rasgos: {Math.round(match.scoreTexto)}%
          </ThemedText>
        </View>
      </View>
    </>
  );
}
