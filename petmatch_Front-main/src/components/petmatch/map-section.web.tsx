import { useMemo } from "react";
import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemeColors } from "@/contexts/theme-context";
import { AlertaPerdida, ReporteAvistamiento } from "@/types/api";
import { getMapStyles } from "./map.styles";
import { generateLeafletHtml } from "./map.utils";

interface MapSectionProps {
  alertas: AlertaPerdida[];
  avistamientos?: ReporteAvistamiento[];
  colors: ThemeColors;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  suspendido?: boolean;
}

export default function MapSection({
  alertas,
  avistamientos = [],
  colors,
  initialRegion,
}: MapSectionProps) {
  const styles = getMapStyles(colors);

  const mapHtml = useMemo(
    () => generateLeafletHtml(alertas, avistamientos, initialRegion),
    [alertas, avistamientos, initialRegion]
  );
  const firmaMapa = useMemo(
    () =>
      [
        ...alertas.map((a) => a.id),
        ...avistamientos.map((a) => a.id),
      ].join("|"),
    [alertas, avistamientos],
  );

  return (
    <View style={styles.wrapper}>
      {/* Leyenda visual del mapa */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
          <ThemedText type="small" style={styles.legendText}>
            Perdidas ({alertas.length})
          </ThemedText>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
          <ThemedText type="small" style={styles.legendText}>
            Avistamientos ({avistamientos.length})
          </ThemedText>
        </View>
      </View>

      {/* Contenedor del mapa */}
      <View style={styles.mapContainer}>
        <iframe
          key={firmaMapa}
          srcDoc={mapHtml}
          style={styles.iframe}
          title="Mapa interactivo PetMatch"
        />
      </View>
    </View>
  );
}
