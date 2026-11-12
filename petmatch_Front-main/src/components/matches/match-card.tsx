import { View } from "react-native";

import { useThemedStyles } from "@/hooks/use-themed-styles";
import { webClass, webDelay } from "@/lib/web-motion";
import type { InformeForense } from "@/types/ai";
import type { AlertaPerdida, Match, ReporteAvistamiento } from "@/types/api";
import { ForensicReport, ForensicTrigger } from "./forensic-report";
import { getMatchCardStyles } from "./match-card.styles";
import { MatchDetails } from "./match-details";
import { MatchScoreHeader } from "./match-score-header";
import { PhotoComparison } from "./photo-comparison";

interface MatchCardProps {
  index?: number;
  match: Match;
  alerta: AlertaPerdida;
  avistamiento: ReporteAvistamiento;
  informe?: InformeForense;
  cargandoInforme: boolean;
  onSolicitarInforme: () => void;
}

/** Tarjeta de una coincidencia: compone puntaje, fotos, peritaje IA y contacto. */
export function MatchCard({
  index = 0,
  match,
  alerta,
  avistamiento,
  informe,
  cargandoInforme,
  onSolicitarInforme,
}: MatchCardProps) {
  const styles = useThemedStyles(getMatchCardStyles);

  return (
    <View
      {...webClass("pet-card-interactive", "fade-in-slide")}
      style={[styles.matchCard, webDelay(index)]}
    >
      <MatchScoreHeader match={match} alerta={alerta} avistamiento={avistamiento} />
      <PhotoComparison fotoMascota={alerta.mascota.fotoUrl} fotoAvistamiento={avistamiento.fotoUrl} />
      {informe ? (
        <ForensicReport
          informe={informe}
          onReintentar={informe.modeloUtilizado === "local" ? onSolicitarInforme : undefined}
          reintentando={cargandoInforme}
        />
      ) : (
        <ForensicTrigger cargando={cargandoInforme} onPress={onSolicitarInforme} />
      )}
      <MatchDetails alerta={alerta} avistamiento={avistamiento} />
    </View>
  );
}
