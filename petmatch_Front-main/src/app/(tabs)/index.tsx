import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/petmatch/empty-state";
import { FilterChips, FilterType } from "@/components/petmatch/filter-chips";
import MapSection from "@/components/petmatch/map-section";
import { PetCard } from "@/components/petmatch/card";
import { SightingCard } from "@/components/petmatch/sighting-card";
import { MatchesModal } from "@/components/matches/matches-modal";
import { PosterModal } from "@/components/petmatch/poster-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAppTheme } from "@/contexts/theme-context";
import { useFocusEffect } from "expo-router";
import { apiRequest, ApiRequestError } from "@/services/api";
import { AlertaPerdida, MatchesResponse, ReporteAvistamiento } from "@/types/api";
import { getHomeStyles } from "@/components/petmatch/home.styles";

interface AlertasResponse {
  alertas: AlertaPerdida[];
}

interface AvistamientosResponse {
  avistamientos: ReporteAvistamiento[];
}

const MELIPILLA = { latitude: -33.6869, longitude: -71.2149 };

function abrirWhatsApp(numero: string, nombreMascota: string) {
  const limpio = numero.replace(/\D/g, "");
  const mensaje = encodeURIComponent(
    `Hola, vi la publicación de ${nombreMascota} en PetMatch y tengo información para ayudarte.`
  );
  Linking.openURL(`https://wa.me/${limpio}?text=${mensaje}`);
}

async function compartirAlerta(alerta: AlertaPerdida) {
  try {
    await Share.share({
      title: `Mascota perdida: ${alerta.mascota.nombre}`,
      message: `¡Ayúdanos a encontrar a ${alerta.mascota.nombre}! Es un ${alerta.mascota.especie} perdido en ${
        alerta.sector ?? "Melipilla"
      }. Si lo viste, contáctanos a través de PetMatch: ${
        alerta.whatsapp ? "WhatsApp: " + alerta.whatsapp : ""
      }`,
    });
  } catch {}
}

export default function HomeScreen() {
  const { colors, tema, toggleTema } = useAppTheme();
  const styles = getHomeStyles(colors);

  const [alertas, setAlertas] = useState<AlertaPerdida[]>([]);
  const [avistamientos, setAvistamientos] = useState<ReporteAvistamiento[]>([]);
  const [matchesPorAlerta, setMatchesPorAlerta] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FilterType>("todos");
  const [alertaParaMatches, setAlertaParaMatches] = useState<AlertaPerdida | null>(null);
  const [alertaParaAfiche, setAlertaParaAfiche] = useState<AlertaPerdida | null>(null);
  const [mostrarSeguridad, setMostrarSeguridad] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      setError(null);
      const [alertasData, avistamientosData, matchesData] = await Promise.all([
        apiRequest<AlertasResponse>("/api/alertas"),
        apiRequest<AvistamientosResponse>("/api/avistamientos").catch(() => ({ avistamientos: [] })),
        apiRequest<MatchesResponse>("/api/matches").catch(() => ({ total: 0, matches: [] })),
      ]);

      setAlertas(alertasData.alertas || []);
      setAvistamientos(avistamientosData.avistamientos || []);

      const mapaMatches: Record<string, number> = {};
      (matchesData.matches || []).forEach((m) => {
        mapaMatches[m.alertaPerdidaId] = (mapaMatches[m.alertaPerdidaId] || 0) + 1;
      });
      setMatchesPorAlerta(mapaMatches);
    } catch (err) {
      const mensaje =
        err instanceof ApiRequestError ? err.message : "Error de conexión";
      setError(mensaje);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const onRefresh = () => {
    setRefrescando(true);
    cargarDatos();
  };

  // Conteos para los chips
  const counts = useMemo(() => {
    return {
      todos: alertas.length,
      urgente: alertas.filter((a) => a.urgente).length,
      perro: alertas.filter((a) =>
        a.mascota.especie.toLowerCase().includes("perr")
      ).length,
      gato: alertas.filter((a) =>
        a.mascota.especie.toLowerCase().includes("gat")
      ).length,
      avistamientos: avistamientos.length,
    };
  }, [alertas, avistamientos]);

  const esVistaAvistamientos = filtro === "avistamientos";

  // Alertas filtradas por categoría y búsqueda
  const alertasFiltradas = useMemo(() => {
    let list = alertas;

    if (filtro === "urgente") {
      list = list.filter((a) => a.urgente);
    } else if (filtro === "perro") {
      list = list.filter((a) =>
        a.mascota.especie.toLowerCase().includes("perr")
      );
    } else if (filtro === "gato") {
      list = list.filter((a) =>
        a.mascota.especie.toLowerCase().includes("gat")
      );
    }

    const q = busqueda.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.mascota.nombre.toLowerCase().includes(q) ||
          (a.sector && a.sector.toLowerCase().includes(q)) ||
          a.mascota.especie.toLowerCase().includes(q)
      );
    }

    return list;
  }, [alertas, filtro, busqueda]);

  // Avistamientos filtrados por búsqueda
  const avistamientosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return avistamientos;
    return avistamientos.filter(
      (av) =>
        av.especie.toLowerCase().includes(q) ||
        (av.comuna && av.comuna.toLowerCase().includes(q)) ||
        (av.descripcion && av.descripcion.toLowerCase().includes(q))
    );
  }, [avistamientos, busqueda]);

  const listaActual = esVistaAvistamientos ? avistamientosFiltrados : alertasFiltradas;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <FlatList
          data={listaActual as any[]}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerSection}>
              {/* Top Bar Principal */}
              <View style={styles.headerBar}>
                <View style={styles.headerLeft}>
                  <View style={styles.logoCircle}>
                    <Ionicons name="paw" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <ThemedText type="subtitle" style={styles.brandTitle}>
                      PetMatch
                    </ThemedText>
                    <View style={styles.locationPill}>
                      <Ionicons name="location-sharp" size={11} color={colors.tint} />
                      <ThemedText type="small" style={styles.locationLabel}>
                        Melipilla, Chile
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.headerRight}>
                  {counts.urgente > 0 && (
                    <View style={styles.urgentCounter}>
                      <Ionicons name="alert-circle" size={13} color={colors.urgent} />
                      <ThemedText style={styles.urgentCounterText}>
                        {counts.urgente} urgentes
                      </ThemedText>
                    </View>
                  )}

                  <Pressable onPress={toggleTema} style={styles.themeToggle}>
                    <Ionicons
                      name={tema === "dark" ? "sunny" : "moon"}
                      size={16}
                      color={colors.tint}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Escudo de Seguridad y Prevención de Estafas */}
              {mostrarSeguridad && (
                <View style={styles.securityBanner}>
                  <View style={styles.securityIconWrap}>
                    <Ionicons name="shield-checkmark" size={18} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.securityTitle}>
                      Consejo de Seguridad PetMatch
                    </ThemedText>
                    <ThemedText style={styles.securityDesc}>
                      Si alguien dice tener a tu mascota: nunca transfieras dinero ni des códigos SMS. Pide siempre una foto o videollamada actual y acuerda la entrega en lugares públicos.
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setMostrarSeguridad(false)}
                    style={styles.securityCloseBtn}
                  >
                    <Ionicons name="close" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              )}

              {/* Buscador Redondeado */}
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color={colors.textSecondary} />
                <TextInput
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder={
                    esVistaAvistamientos
                      ? "Buscar por especie o descripción vista..."
                      : "Buscar por nombre o sector..."
                  }
                  placeholderTextColor={colors.textSecondary + "90"}
                  style={styles.searchInput}
                  autoCapitalize="none"
                />
                {busqueda.length > 0 && (
                  <Pressable onPress={() => setBusqueda("")} style={styles.clearBtn}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                )}
              </View>

              {/* Barra de Filtros Rápidos (Chips) */}
              <FilterChips
                selected={filtro}
                onSelect={setFiltro}
                counts={counts}
              />

              {/* Sección de Mapa Interactivo con Alertas y Avistamientos */}
              <View style={styles.mapWrap}>
                <MapSection
                  alertas={alertasFiltradas}
                  avistamientos={avistamientos}
                  colors={colors}
                  initialRegion={{
                    ...MELIPILLA,
                    latitudeDelta: 0.08,
                    longitudeDelta: 0.08,
                  }}
                />
              </View>

              {/* Título de la lista de Casos */}
              <View style={styles.listTitleRow}>
                <View style={styles.accentIndicator} />
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  {esVistaAvistamientos
                    ? "Avistamientos reportados en la calle"
                    : filtro === "todos"
                    ? "Todas las alertas activas"
                    : filtro === "urgente"
                    ? "Casos que requieren ayuda urgente"
                    : `Alertas de ${filtro}s`}
                </ThemedText>
                <ThemedText style={styles.resultsBadge}>
                  ({listaActual.length})
                </ThemedText>
              </View>

              {cargando && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <ThemedText type="small" themeColor="textSecondary">
                    Cargando información comunitaria...
                  </ThemedText>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) =>
            esVistaAvistamientos ? (
              <SightingCard avistamiento={item as ReporteAvistamiento} />
            ) : (
              <PetCard
                alerta={item as AlertaPerdida}
                matchesCount={matchesPorAlerta[(item as AlertaPerdida).id]}
                onWhatsApp={abrirWhatsApp}
                onShare={compartirAlerta}
                onViewMatches={setAlertaParaMatches}
                onGenerarAfiche={setAlertaParaAfiche}
              />
            )
          }
          ListEmptyComponent={
            !cargando ? (
              <EmptyState
                title={
                  error
                    ? "Error al conectar con la API"
                    : busqueda
                    ? `Sin resultados para "${busqueda}"`
                    : esVistaAvistamientos
                    ? "No hay avistamientos registrados"
                    : "No hay mascotas en esta categoría"
                }
                message={
                  error
                    ? `${error}. Asegúrate de que el backend esté ejecutándose en el puerto 8000.`
                    : esVistaAvistamientos
                    ? "Sé el primero en reportar un animal visto en la calle usando la pestaña Reportar."
                    : "Prueba seleccionando 'Perdidas' o buscando por otro nombre o sector."
                }
                buttonText={error ? "Reintentar conexión" : "Ver todas las alertas"}
                onReset={() => {
                  if (error) {
                    setCargando(true);
                    cargarDatos();
                  } else {
                    setBusqueda("");
                    setFiltro("todos");
                  }
                }}
              />
            ) : null
          }
        />

        {/* Modal de Posibles Matches */}
        <MatchesModal
          alerta={alertaParaMatches}
          visible={!!alertaParaMatches}
          onClose={() => setAlertaParaMatches(null)}
        />

        {/* Modal de Afiche SE BUSCA */}
        <PosterModal
          alerta={alertaParaAfiche}
          visible={!!alertaParaAfiche}
          onClose={() => setAlertaParaAfiche(null)}
        />
      </SafeAreaView>
    </ThemedView>
  );
}
