import { View } from "react-native";

import { useThemedStyles } from "@/hooks/use-themed-styles";
import type { InformeForense } from "@/types/ai";
import type { AlertaPerdida, Match, ReporteAvistamiento } from "@/types/api";
import { ForensicReport, ForensicTrigger } from "./forensic-report";
import { getMatchCardStyles } from "./match-card.styles";
import { MatchDetails } from "./match-details";
import { MatchScoreHeader } from "./match-score-header";
import { PhotoComparison } from "./photo-comparison";

interface MatchCardProps {
  match: Match;
  alerta: AlertaPerdida;
  avistamiento: ReporteAvistamiento;
  informe?: InformeForense;
  cargandoInforme: boolean;
  onSolicitarInforme: () => void;
}

/** Tarjeta de una coincidencia: compone puntaje, fotos, peritaje IA y contacto. */
export function MatchCard({
  match,
  alerta,
  avistamiento,
  informe,
  cargandoInforme,
  onSolicitarInforme,
}: MatchCardProps) {
  const styles = useThemedStyles(getMatchCardStyles);

  return (
    <View style={styles.matchCard}>
      <MatchScoreHeader match={match} alerta={alerta} avistamiento={avistamiento} />
      <PhotoComparison fotoMascota={alerta.mascota.fotoUrl} fotoAvistamiento={avistamiento.fotoUrl} />
      {informe ? (
        <ForensicReport informe={informe} />
      ) : (
        <ForensicTrigger cargando={cargandoInforme} onPress={onSolicitarInforme} />
      )}
      <MatchDetails alerta={alerta} avistamiento={avistamiento} />
    </View>
  );
}
