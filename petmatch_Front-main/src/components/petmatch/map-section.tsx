import { useMemo } from "react";
import { StyleSheet, View, Text, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AlertaPerdida, ReporteAvistamiento } from "@/types/api";
import { generateLeafletHtml } from "./map.utils";

import { WebView } from "react-native-webview";

interface MapSectionProps {
  alertas: AlertaPerdida[];
  avistamientos?: ReporteAvistamiento[];
  colors: any;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export default function MapSection({
  alertas,
  avistamientos = [],
  colors,
  initialRegion,
}: MapSectionProps) {
  const lat = initialRegion?.latitude ?? -33.6869;
  const lng = initialRegion?.longitude ?? -71.2149;

  // Reutiliza la función centralizada de generación de mapa
  const mapHtml = useMemo(
    () => generateLeafletHtml(alertas, avistamientos, initialRegion),
    [alertas, avistamientos, initialRegion]
  );

  const abrirEnGoogleMaps = () => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  const alertasConUbicacion = (alertas || []).filter(
    (a) => typeof a.latitud === "number" && typeof a.longitud === "number"
  );

  if (!WebView) {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <View style={styles.fallbackHeader}>
          <View style={[styles.mapIconCircle, { backgroundColor: colors.tint + "20" }]}>
            <Ionicons name="map" size={24} color={colors.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fallbackTitle, { color: colors.text }]}>
              Mapa de Mascotas Perdidas
            </Text>
            <Text style={[styles.fallbackSubtitle, { color: colors.textSecondary }]}>
              {alertasConUbicacion.length} alertas y {avistamientos.length} avistamientos en Melipilla
            </Text>
          </View>
        </View>

        <Pressable
          onPress={abrirEnGoogleMaps}
          style={({ pressed }) => [
            styles.fallbackBtn,
            { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
          <Text style={styles.fallbackBtnText}>Ver zona en Google Maps</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.mapContainer, { borderColor: colors.border }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: mapHtml, baseUrl: "https://cdnjs.cloudflare.com" }}
        style={styles.map}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 280,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    marginVertical: 12,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  fallbackContainer: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    marginVertical: 12,
    gap: 12,
  },
  fallbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mapIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  fallbackSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  fallbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
  },
  fallbackBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
