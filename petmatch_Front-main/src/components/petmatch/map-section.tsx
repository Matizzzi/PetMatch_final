import { useMemo } from "react";
import { StyleSheet, View, Text, Pressable, Linking, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AlertaPerdida, ReporteAvistamiento } from "@/types/api";
import { generateLeafletHtml } from "./map.utils";

// Carga defensiva: en Expo Go o entornos sin el módulo nativo compilado,
// evitamos que la app crashee en el arranque si falta RNCWebViewModule.
let WebViewComponent: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebViewComponent = require("react-native-webview").WebView;
} catch {
  WebViewComponent = null;
}

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

  if (!WebViewComponent) {
    const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=650x300&maptype=mapnik`;

    return (
      <View style={[styles.fallbackMapCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
        {/* Imagen visual del mapa de Melipilla */}
        <View style={styles.staticMapImageWrap}>
          <Image
            source={{ uri: staticMapUrl }}
            style={styles.staticMapImage}
            resizeMode="cover"
          />

          {/* Badge superior con leyenda */}
          <View style={styles.mapBadgeOverlay}>
            <View style={styles.badgeItem}>
              <View style={[styles.badgeDot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.badgeText}>Perdidas ({alertas.length})</Text>
            </View>
            <View style={styles.badgeItem}>
              <View style={[styles.badgeDot, { backgroundColor: "#10B981" }]} />
              <Text style={styles.badgeText}>Avistamientos ({avistamientos.length})</Text>
            </View>
          </View>

          {/* Pin central indicador */}
          <View style={styles.centerPinWrap} pointerEvents="none">
            <Ionicons name="location" size={36} color="#EF4444" />
          </View>

          {/* Botón flotante para interactuar */}
          <Pressable
            onPress={abrirEnGoogleMaps}
            style={({ pressed }) => [
              styles.floatingMapBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="navigate-outline" size={16} color="#FFFFFF" />
            <Text style={styles.floatingMapBtnText}>Abrir zona en Google Maps</Text>
          </Pressable>
        </View>

        {/* Pie informativo */}
        <View style={styles.fallbackFooter}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.fallbackFooterText, { color: colors.textSecondary }]}>
            En Expo Go el mapa interactivo se visualiza con este mapa base de Melipilla.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mapContainer, { borderColor: colors.border }]}>
      <WebViewComponent
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
  fallbackMapCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: "hidden",
    marginVertical: 12,
  },
  staticMapImageWrap: {
    height: 220,
    width: "100%",
    position: "relative",
    backgroundColor: "#E5E7EB",
  },
  staticMapImage: {
    width: "100%",
    height: "100%",
  },
  mapBadgeOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badgeDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1F2937",
  },
  centerPinWrap: {
    position: "absolute",
    top: "35%",
    left: "50%",
    marginLeft: -18,
    marginTop: -18,
  },
  floatingMapBtn: {
    position: "absolute",
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingMapBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  fallbackFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fallbackFooterText: {
    fontSize: 11,
    flex: 1,
  },
});
