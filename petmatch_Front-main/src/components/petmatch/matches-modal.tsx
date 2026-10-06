import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { apiRequest, resolveFotoUrl } from "@/services/api";
import { AlertaPerdida, Match, MatchesResponse, ReporteAvistamiento } from "@/types/api";
import { getMatchesModalStyles } from "./matches-modal.styles";

export interface RasgoForense {
  nombre: string;
  porcentaje: number;
  observacion: string;
}

export interface InformeForense {
  porcentajeBiometrico: number;
  veredicto: string;
  nivelConfianza: string;
  resumenEjecutivo: string;
  rasgosAnalizados: RasgoForense[];
  factoresCalle?: string[];
  recomendacion: string;
  modeloUtilizado?: string;
}

function formatearFecha(fechaISO: string): string {
  try {
    const d = new Date(fechaISO);
    return d.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Reciente";
  }
}

function formatDistance(alerta: AlertaPerdida, av: ReporteAvistamiento): string {
  if (!alerta || !av || typeof alerta.latitud !== "number" || typeof av.latitud !== "number") {
    return "Zona cercana";
  }
  const R = 6371;
  const dLat = (av.latitud - alerta.latitud) * (Math.PI / 180);
  const dLon = (av.longitud - alerta.longitud) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(alerta.latitud * (Math.PI / 180)) *
      Math.cos(av.latitud * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  if (km < 0.1) return "Misma ubicación (< 100m)";
  if (km < 1) return `A ${Math.round(km * 1000)}m`;
  return `A ${km.toFixed(1)} km`;
}

function abrirRutaGoogleMaps(alerta: AlertaPerdida, av: ReporteAvistamiento) {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${alerta.latitud},${alerta.longitud}&destination=${av.latitud},${av.longitud}`;
  Linking.openURL(url);
}

interface MatchesModalProps {
  alerta: AlertaPerdida | null;
  visible: boolean;
  onClose: () => void;
}

export function MatchesModal({ alerta, visible, onClose }: MatchesModalProps) {
  const { colors } = useAppTheme();
  const styles = getMatchesModalStyles(colors);

  const [matches, setMatches] = useState<Match[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para Peritaje Biométrico Forense con IA
  const [informesForenses, setInformesForenses] = useState<Record<string, InformeForense>>({});
  const [cargandoForense, setCargandoForense] = useState<Record<string, boolean>>({});

  const solicitarAnalisisForense = async (
    matchId: string,
    fotoMascota: string,
    fotoAvistamiento: string,
    nombre: string,
    especie: string
  ) => {
    setCargandoForense((prev) => ({ ...prev, [matchId]: true }));
    try {
      const res = await apiRequest<{ success: boolean; informe: InformeForense }>(
        "/api/ia/comparar-forense",
        {
          method: "POST",
          body: {
            fotoMascotaUrl: fotoMascota,
            fotoAvistamientoUrl: fotoAvistamiento,
            nombreMascota: nombre,
            especie: especie,
          },
        }
      );
      if (res?.informe) {
        setInformesForenses((prev) => ({ ...prev, [matchId]: res.informe }));
      }
    } catch (e: any) {
      Alert.alert(
        "Análisis Forense",
        "No se pudo completar el análisis pericial con IA en este momento. Inténtalo nuevamente."
      );
    } finally {
      setCargandoForense((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  useEffect(() => {
    if (!visible || !alerta) return;

    let cancelado = false;
    async function cargarMatches() {
      setCargando(true);
      setError(null);
      try {
        const res = await apiRequest<MatchesResponse>(
          `/api/matches?alertaId=${alerta!.id}&minScore=40`
        );
        if (!cancelado) {
          setMatches(res.matches || []);
        }
      } catch (err: any) {
        if (!cancelado) {
          setError("No se pudieron cargar los matches.");
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarMatches();

    return () => {
      cancelado = true;
    };
  }, [visible, alerta]);

  if (!alerta) return null;

  const contactarTestigo = (telefono: string, nombreMascota: string) => {
    const limpio = telefono.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hola! Vi tu reporte de avistamiento en PetMatch. Creo que el animalito que viste podría ser mi mascota ${nombreMascota}. ¿Me podrías dar más información?`
    );
    Linking.openURL(`https://wa.me/${limpio}?text=${msg}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
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

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Contenido */}
          {cargando ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.tint} />
              <ThemedText themeColor="textSecondary" style={{ marginTop: 12 }}>
                Cruzando datos geográficos y temporales...
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.urgent} />
              <ThemedText style={{ color: colors.urgent, marginTop: 8 }}>
                {error}
              </ThemedText>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
              </View>
              <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
                Sin avistamientos coincidentes por ahora
              </ThemedText>
              <ThemedText
                themeColor="textSecondary"
                type="small"
                style={{ textAlign: "center", lineHeight: 20, paddingHorizontal: 20 }}
              >
                Cuando alguien reporte en la pestaña “Reportar” un animal con la misma
                especie y cerca de {alerta.sector ?? "tu zona"}, aparecerá aquí de inmediato.
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.matchesList}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.summaryBanner}>
                <Ionicons name="calculator-outline" size={20} color={colors.tint} />
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText style={{ color: colors.tint, fontSize: 13, fontWeight: "700" }}>
                    {matches.length} coincidencia(s) detectadas por el algoritmo
                  </ThemedText>
                  <ThemedText style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 15 }}>
                    Ponderación real: 55% Distancia (Fórmula de Haversine) + 25% Proximidad temporal + 20% Rasgos clave.
                  </ThemedText>
                </View>
              </View>

              {matches.map((match) => {
                const m = match;
                const av = m.avistamiento;
                if (!av) return null;

                const scoreColor =
                  m.scoreTotal >= 80
                    ? "#10B981"
                    : m.scoreTotal >= 60
                    ? "#F59E0B"
                    : colors.textSecondary;

                return (
                  <View key={m.id} style={styles.matchCard}>
                    {/* Barra de Score */}
                    <View style={styles.matchScoreBar}>
                      <View
                        style={[
                          styles.scoreBadge,
                          { backgroundColor: scoreColor + "20", borderColor: scoreColor },
                        ]}
                      >
                        <Ionicons name="checkmark-circle" size={15} color={scoreColor} />
                        <ThemedText
                          type="small"
                          style={{ color: scoreColor, fontWeight: "800" }}
                        >
                          {Math.round(m.scoreTotal)}% Coincidencia
                        </ThemedText>
                      </View>

                      <ThemedText themeColor="textSecondary" type="small">
                        {formatearFecha(av.fechaAvistamiento || av.createdAt)}
                      </ThemedText>
                    </View>

                    {/* Barra visual de porcentaje */}
                    <View style={styles.scoreTrack}>
                      <View
                        style={[
                          styles.scoreFill,
                          {
                            width: `${Math.min(100, Math.max(15, m.scoreTotal))}%`,
                            backgroundColor: scoreColor,
                          },
                        ]}
                      />
                    </View>

                    {/* Desglose analítico de los 3 factores de Match */}
                    <View style={styles.metricsRow}>
                      <View style={styles.metricItem}>
                        <Ionicons name="location" size={13} color={colors.tint} />
                        <ThemedText style={styles.metricText}>
                          {formatDistance(alerta, av)}
                        </ThemedText>
                      </View>
                      <View style={styles.metricItem}>
                        <Ionicons name="time" size={13} color="#F59E0B" />
                        <ThemedText style={[styles.metricText, { color: "#D97706" }]}>
                          {m.scoreTiempo >= 90 ? "Mismo día" : `Tiempo: ${Math.round(m.scoreTiempo)}%`}
                        </ThemedText>
                      </View>
                      <View style={styles.metricItem}>
                        <Ionicons name="sparkles" size={13} color="#10B981" />
                        <ThemedText style={[styles.metricText, { color: "#059669" }]}>
                          Rasgos: {Math.round(m.scoreTexto)}%
                        </ThemedText>
                      </View>
                    </View>

                    {/* Comparación Visual de Fotos */}
                    <View style={styles.photosComparison}>
                      <View style={styles.photoCol}>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.photoLabel}>
                          Tu Mascota
                        </ThemedText>
                        <Image
                          source={{
                            uri:
                              resolveFotoUrl(alerta.mascota.fotoUrl) ||
                              "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800",
                          }}
                          style={styles.comparePhoto}
                          contentFit="cover"
                        />
                      </View>

                      <View style={styles.vsBadge}>
                        <ThemedText style={styles.vsText}>VS</ThemedText>
                      </View>

                      <View style={styles.photoCol}>
                        <ThemedText type="small" themeColor="textSecondary" style={styles.photoLabel}>
                          Visto en calle
                        </ThemedText>
                        <Image
                          source={{
                            uri:
                              resolveFotoUrl(av.fotoUrl) ||
                              "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800",
                          }}
                          style={styles.comparePhoto}
                          contentFit="cover"
                        />
                      </View>
                    </View>

                    {/* Informe Forense de Rasgos Biométricos con IA */}
                    {!informesForenses[match.id] ? (
                      <Pressable
                        style={styles.btnAnalisisForense}
                        onPress={() =>
                          solicitarAnalisisForense(
                            match.id,
                            alerta.mascota.fotoUrl || "",
                            av.fotoUrl || "",
                            alerta.mascota.nombre,
                            alerta.mascota.especie
                          )
                        }
                        disabled={cargandoForense[match.id]}
                      >
                        {cargandoForense[match.id] ? (
                          <>
                            <ActivityIndicator size="small" color={colors.tint} />
                            <ThemedText style={styles.btnAnalisisForenseText}>
                              Analizando biometría y rasgos de calle con IA...
                            </ThemedText>
                          </>
                        ) : (
                          <>
                            <Ionicons name="sparkles" size={15} color={colors.tint} />
                            <ThemedText style={styles.btnAnalisisForenseText}>
                              Ver Peritaje Biométrico con IA (Morfología y Calle)
                            </ThemedText>
                          </>
                        )}
                      </Pressable>
                    ) : (
                      <View style={styles.forenseCard}>
                        {/* Header del peritaje */}
                        <View style={styles.forenseHeader}>
                          <View style={styles.forenseTitleWrap}>
                            <Ionicons name="finger-print-outline" size={18} color={colors.tint} />
                            <ThemedText style={styles.forenseTitle}>
                              Peritaje Biométrico Forense
                            </ThemedText>
                          </View>
                          <View
                            style={[
                              styles.forenseBadge,
                              {
                                backgroundColor:
                                  informesForenses[match.id].veredicto === "ALTA COINCIDENCIA"
                                    ? colors.whatsapp + "20"
                                    : informesForenses[match.id].veredicto === "COINCIDENCIA MODERADA"
                                    ? "#F59E0B20"
                                    : colors.urgent + "20",
                                borderColor:
                                  informesForenses[match.id].veredicto === "ALTA COINCIDENCIA"
                                    ? colors.whatsapp
                                    : informesForenses[match.id].veredicto === "COINCIDENCIA MODERADA"
                                    ? "#F59E0B"
                                    : colors.urgent,
                              },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.forenseBadgeText,
                                {
                                  color:
                                    informesForenses[match.id].veredicto === "ALTA COINCIDENCIA"
                                      ? colors.whatsapp
                                      : informesForenses[match.id].veredicto === "COINCIDENCIA MODERADA"
                                      ? "#D97706"
                                      : colors.urgent,
                                },
                              ]}
                            >
                              {informesForenses[match.id].veredicto} (
                              {informesForenses[match.id].porcentajeBiometrico}%)
                            </ThemedText>
                          </View>
                        </View>

                        {/* Resumen pericial */}
                        <ThemedText style={styles.forenseResumen}>
                          "{informesForenses[match.id].resumenEjecutivo}"
                        </ThemedText>

                        {/* Desglose de rasgos morfológicos */}
                        <View style={styles.forenseRasgos}>
                          {informesForenses[match.id].rasgosAnalizados.map((rasgo, rIdx) => (
                            <View key={rIdx} style={styles.rasgoRow}>
                              <View style={styles.rasgoHeader}>
                                <ThemedText style={styles.rasgoNombre}>
                                  {rasgo.nombre}
                                </ThemedText>
                                <ThemedText style={styles.rasgoScore}>
                                  {rasgo.porcentaje}%
                                </ThemedText>
                              </View>
                              <View style={styles.rasgoBarBg}>
                                <View
                                  style={[
                                    styles.rasgoBarFill,
                                    {
                                      width: `${Math.min(100, Math.max(0, rasgo.porcentaje))}%`,
                                      backgroundColor:
                                        rasgo.porcentaje >= 80
                                          ? colors.whatsapp
                                          : rasgo.porcentaje >= 50
                                          ? colors.tint
                                          : colors.urgent,
                                    },
                                  ]}
                                />
                              </View>
                              <ThemedText style={styles.rasgoObs}>
                                {rasgo.observacion}
                              </ThemedText>
                            </View>
                          ))}
                        </View>

                        {/* Factores de desgaste en calle detectados */}
                        {informesForenses[match.id].factoresCalle &&
                          informesForenses[match.id].factoresCalle!.length > 0 && (
                            <View style={styles.factoresCalleWrap}>
                              <ThemedText style={styles.factoresTitle}>
                                Alteraciones por Estado de Calle Detectadas:
                              </ThemedText>
                              <View style={styles.factoresPillRow}>
                                {informesForenses[match.id].factoresCalle!.map((factor, fIdx) => (
                                  <View key={fIdx} style={styles.factorPill}>
                                    <Ionicons
                                      name="warning-outline"
                                      size={12}
                                      color={colors.urgent}
                                    />
                                    <ThemedText style={styles.factorPillText}>
                                      {factor}
                                    </ThemedText>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}

                        {/* Recomendación pericial in situ */}
                        {informesForenses[match.id].recomendacion && (
                          <View style={styles.recomBox}>
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={16}
                              color={colors.whatsapp}
                              style={{ marginTop: 1 }}
                            />
                            <ThemedText style={styles.recomText}>
                              <ThemedText style={{ fontWeight: "700" }}>
                                Recomendación Pericial:{" "}
                              </ThemedText>
                              {informesForenses[match.id].recomendacion}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Detalles del Avistamiento */}
                    <View style={styles.matchDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={15} color={colors.tint} />
                        <ThemedText type="small" style={{ flex: 1 }}>
                          <ThemedText type="defaultSemiBold">Lugar: </ThemedText>
                          {av.comuna || "Sector reportado"}
                        </ThemedText>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons name="chatbox-ellipses-outline" size={15} color={colors.textSecondary} />
                        <ThemedText
                          type="small"
                          themeColor="textSecondary"
                          style={{ flex: 1 }}
                        >
                          "{av.descripcion}"
                        </ThemedText>
                      </View>

                      {av.contactoNombre && (
                        <View style={styles.detailRow}>
                          <Ionicons name="person-outline" size={15} color={colors.textSecondary} />
                          <ThemedText type="small" themeColor="textSecondary">
                            Testigo: {av.contactoNombre}
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Botón para ver ruta en mapa */}
                    <Pressable
                      style={styles.routeBtn}
                      onPress={() => abrirRutaGoogleMaps(alerta, av)}
                    >
                      <Ionicons name="navigate-outline" size={14} color={colors.tint} />
                      <ThemedText style={styles.routeBtnText}>
                        Ver ruta en mapa entre ambos puntos
                      </ThemedText>
                    </Pressable>

                    {/* Botón de Contacto */}
                    {av.contactoTelefono ? (
                      <Pressable
                        style={styles.contactBtn}
                        onPress={() =>
                          contactarTestigo(av.contactoTelefono!, alerta.mascota.nombre)
                        }
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                        <ThemedText style={styles.contactBtnText}>
                          Contactar a quien lo vio ({av.contactoTelefono})
                        </ThemedText>
                      </Pressable>
                    ) : (
                      <View style={styles.noPhoneInfo}>
                        <ThemedText type="small" themeColor="textSecondary">
                          El testigo no dejó teléfono público.
                        </ThemedText>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
