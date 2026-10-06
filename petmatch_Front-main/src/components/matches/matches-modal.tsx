import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { useForensicAnalysis } from "@/hooks/use-forensic-analysis";
import { useMatches } from "@/hooks/use-matches";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import type { AlertaPerdida } from "@/types/api";
import { MatchCard } from "./match-card";
import { getMatchesModalStyles } from "./matches-modal.styles";
import { MatchesEmpty, MatchesError, MatchesLoading, MatchesSummary } from "./matches-states";

interface MatchesModalProps {
  alerta: AlertaPerdida | null;
  visible: boolean;
  onClose: () => void;
}

/** Bottom sheet con las coincidencias de una alerta (container). */
export function MatchesModal({ alerta, visible, onClose }: MatchesModalProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(getMatchesModalStyles);
  const { matches, cargando, error } = useMatches(alerta, visible);
  const forense = useForensicAnalysis();

  if (!alerta) return null;

  const renderContenido = () => {
    if (cargando) return <MatchesLoading />;
    if (error) return <MatchesError message={error} />;
    if (matches.length === 0) return <MatchesEmpty sector={alerta.sector} />;

    return (
      <ScrollView contentContainerStyle={styles.matchesList} showsVerticalScrollIndicator={false}>
        <MatchesSummary total={matches.length} />
        {matches.map((match) =>
          match.avistamiento ? (
            <MatchCard
              key={match.id}
              match={match}
              alerta={alerta}
              avistamiento={match.avistamiento}
              informe={forense.informes[match.id]}
              cargandoInforme={!!forense.cargando[match.id]}
              onSolicitarInforme={() => forense.solicitar(match.id, alerta, match.avistamiento!)}
            />
          ) : null,
        )}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Ionicons name="sparkles" size={20} color={colors.tint} />
                <ThemedText type="subtitle" style={styles.headerTitle}>
                  Coincidencias (Matches)
                </ThemedText>
              </View>
              <ThemedText themeColor="textSecondary" type="small">
                Para {alerta.mascota.nombre} ({alerta.mascota.especie})
              </ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {renderContenido()}
        </View>
      </View>
    </Modal>
  );
}
