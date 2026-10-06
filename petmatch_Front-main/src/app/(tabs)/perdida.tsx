import { Ionicons } from "@expo/vector-icons";

let ImagePicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ImagePicker = require("expo-image-picker");
} catch {
  ImagePicker = null;
}
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FloatingTabBarHeight, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useAppTheme } from "@/contexts/theme-context";
import { apiRequest, ApiRequestError } from "@/services/api";
import { PosterModal } from "@/components/petmatch/poster-modal";
import { AlertaPerdida } from "@/types/api";

type EspecieType = "perro" | "gato" | "otro";

const COORDENADAS_DEFAULT = {
  latitud: -33.6869,
  longitud: -71.2149,
};

export default function PerdidaScreen() {
  const { colors } = useAppTheme();
  const { usuario } = useAuth();

  // Estados del Formulario
  const [nombreMascota, setNombreMascota] = useState("");
  const [especie, setEspecie] = useState<EspecieType>("perro");
  const [descripcion, setDescripcion] = useState("");
  const [sector, setSector] = useState("Melipilla");
  const [whatsapp, setWhatsapp] = useState("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  // Estados de salud y collar
  const [usaCollar, setUsaCollar] = useState(false);
  const [descripcionCollar, setDescripcionCollar] = useState("");
  const [tieneChip, setTieneChip] = useState(false);
  const [condicionMedica, setCondicionMedica] = useState("");
  const [urgente, setUrgente] = useState(false);

  // Estados de interfaz
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [alertaCreada, setAlertaCreada] = useState<AlertaPerdida | null>(null);
  const [mostrarAfiche, setMostrarAfiche] = useState(false);

  // Estados de IA Vision
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState<any>(null);

  // Selector de imagen
  const seleccionarFoto = async () => {
    if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
      Alert.alert(
        "Aviso",
        "El selector de fotos nativo requiere una Development Build de la app. Por ahora puedes continuar y publicar la alerta sin foto."
      );
      return;
    }
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        if (Platform.OS === "web") {
          // En web el picker puede funcionar directamente
        } else {
          Alert.alert(
            "Permiso requerido",
            "Necesitamos acceso a tus fotos para subir una imagen de tu mascota."
          );
          return;
        }
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets[0]?.uri) {
        setFotoUri(resultado.assets[0].uri);
      }
    } catch (err) {
      console.warn("Error al abrir galería:", err);
    }
  };

  const quitarFoto = () => {
    setFotoUri(null);
    setResultadoIA(null);
  };

  // Analizar foto con IA (Gemini Vision)
  const analizarConIA = async () => {
    if (!fotoUri) return;

    setAnalizandoIA(true);
    setResultadoIA(null);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const res = await fetch(fotoUri);
        const blob = await res.blob();
        formData.append("foto", blob, "mascota.jpg");
      } else {
        const uriParts = fotoUri.split(".");
        const ext = uriParts[uriParts.length - 1] || "jpg";
        formData.append("foto", {
          uri: fotoUri,
          name: `mascota.${ext}`,
          type: `image/${ext === "png" ? "png" : "jpeg"}`,
        } as any);
      }

      const data = await apiRequest<{
        success: boolean;
        analisis: {
          especie: string;
          razaEstimada: string;
          colorPelaje: string;
          tamano: string;
          usaCollar: boolean;
          senasParticulares: string;
          descripcionSugerida: string;
        };
      }>("/api/ia/analizar", {
        method: "POST",
        body: formData,
      });

      if (data.success && data.analisis) {
        const a = data.analisis;
        setResultadoIA(a);

        // Auto-rellenar campos del formulario
        if (a.especie === "gato") setEspecie("gato");
        else if (a.especie === "perro") setEspecie("perro");
        else setEspecie("otro");

        if (a.usaCollar !== undefined) setUsaCollar(a.usaCollar);

        // Construir descripción rica combinando lo que devuelve la IA
        const partes: string[] = [];
        if (a.razaEstimada) partes.push(`Raza estimada: ${a.razaEstimada}`);
        if (a.colorPelaje) partes.push(`Pelaje: ${a.colorPelaje}`);
        if (a.tamano) partes.push(`Tamaño: ${a.tamano}`);
        if (a.senasParticulares) partes.push(a.senasParticulares);

        setDescripcion(partes.join(". ") + ".");
      }
    } catch (err: any) {
      Alert.alert(
        "Error de IA",
        err?.message || "No se pudo analizar la imagen. Intenta de nuevo."
      );
    } finally {
      setAnalizandoIA(false);
    }
  };

  // Enviar Formulario
  const handleSubmit = async () => {
    setErrorMsg(null);

    // Validaciones
    if (!nombreMascota.trim()) {
      setErrorMsg("Por favor, ingresa el nombre de tu mascota.");
      return;
    }

    if (!descripcion.trim()) {
      setErrorMsg("Por favor, describe a tu mascota (color, tamaño, señas particulares).");
      return;
    }

    if (!sector.trim()) {
      setErrorMsg("Por favor, indica el sector o comuna donde se extravió.");
      return;
    }

    if (!whatsapp.trim()) {
      setErrorMsg("Ingresa un número de WhatsApp para que puedan contactarte.");
      return;
    }

    setCargando(true);

    try {
      const formData = new FormData();
      formData.append("nombreMascota", nombreMascota.trim());
      formData.append("especie", especie);
      formData.append("descripcion", descripcion.trim());
      formData.append("latitud", String(COORDENADAS_DEFAULT.latitud));
      formData.append("longitud", String(COORDENADAS_DEFAULT.longitud));
      formData.append("sector", sector.trim());
      formData.append("urgente", String(urgente));
      formData.append("usaCollar", String(usaCollar));

      if (usaCollar && descripcionCollar.trim()) {
        formData.append("descripcionCollar", descripcionCollar.trim());
      }

      formData.append("tieneChip", String(tieneChip));

      if (condicionMedica.trim()) {
        formData.append("condicionMedica", condicionMedica.trim());
      }

      formData.append("whatsapp", whatsapp.trim());

      // Adjuntar foto si fue seleccionada
      if (fotoUri) {
        if (Platform.OS === "web") {
          const res = await fetch(fotoUri);
          const blob = await res.blob();
          formData.append("foto", blob, "mascota.jpg");
        } else {
          formData.append("foto", {
            uri: fotoUri,
            name: "mascota.jpg",
            type: "image/jpeg",
          } as unknown as Blob);
        }
      }

      const res = await apiRequest<{ success: boolean; alerta: AlertaPerdida }>("/api/alertas", {
        method: "POST",
        body: formData,
        auth: !!usuario,
      });

      const nuevaAlerta: AlertaPerdida = res?.alerta || {
        id: "temp_" + Date.now(),
        mascotaId: "temp",
        usuarioId: usuario?.id || "temp",
        latitud: COORDENADAS_DEFAULT.latitud,
        longitud: COORDENADAS_DEFAULT.longitud,
        sector: sector.trim(),
        urgente,
        whatsapp: whatsapp.trim(),
        fechaPerdida: new Date().toISOString(),
        activa: true,
        createdAt: new Date().toISOString(),
        mascota: {
          id: "temp",
          nombre: nombreMascota,
          especie,
          descripcion,
          fotoUrl: fotoUri,
          usaCollar,
          descripcionCollar,
          tieneChip,
          condicionMedica,
          usuarioId: usuario?.id || "temp",
        },
      };

      setAlertaCreada(nuevaAlerta);
      setExito(true);
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudo publicar la alerta. Revisa que el backend esté conectado.";
      setErrorMsg(msg);
    } finally {
      setCargando(false);
    }
  };

  const reiniciarFormulario = () => {
    setNombreMascota("");
    setEspecie("perro");
    setDescripcion("");
    setSector("Melipilla");
    setWhatsapp("");
    setFotoUri(null);
    setUsaCollar(false);
    setDescripcionCollar("");
    setTieneChip(false);
    setCondicionMedica("");
    setUrgente(false);
    setErrorMsg(null);
    setAlertaCreada(null);
    setMostrarAfiche(false);
    setExito(false);
  };

  // Pantalla de Éxito
  if (exito) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.successContainer}>
            <View style={[styles.successIconCircle, { backgroundColor: colors.tint + "20" }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.tint} />
            </View>

            <ThemedText type="title" style={styles.successTitle}>
              ¡Alerta Publicada!
            </ThemedText>

            <ThemedText themeColor="textSecondary" style={styles.successMessage}>
              La alerta de <ThemedText type="defaultSemiBold">{nombreMascota}</ThemedText> ya está
              activa en el mapa de PetMatch. Quienes la vean podrán comunicarse directamente a tu
              WhatsApp.
            </ThemedText>

            <View style={styles.successActions}>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: "#DC2626", marginBottom: 12 }]}
                onPress={() => setMostrarAfiche(true)}
              >
                <Ionicons name="megaphone" size={18} color="#FFFFFF" />
                <ThemedText style={styles.primaryBtnText}>
                  Generar Afiche "SE BUSCA"
                </ThemedText>
              </Pressable>

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
                onPress={() => {
                  reiniciarFormulario();
                  router.push("/(tabs)");
                }}
              >
                <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                <ThemedText style={styles.primaryBtnText}>Ver en el mapa de alertas</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={reiniciarFormulario}
              >
                <ThemedText type="smallBold" themeColor="tint">
                  Crear otra alerta
                </ThemedText>
              </Pressable>
            </View>

            {/* Modal de Afiche Generado */}
            <PosterModal
              alerta={alertaCreada}
              visible={mostrarAfiche}
              onClose={() => setMostrarAfiche(false)}
            />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: FloatingTabBarHeight + Spacing.six },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Principal */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.badgeIcon, { backgroundColor: colors.urgent + "15" }]}>
                  <Ionicons name="megaphone" size={20} color={colors.urgent} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="title" style={styles.pageTitle}>
                    Se me perdió
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {usuario
                      ? `Publicando como ${usuario.nombre}`
                      : "Alerta comunitaria inmediata (sin registro obligatorio)"}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Banner de Urgencia */}
            <View
              style={[
                styles.urgenteCard,
                {
                  backgroundColor: urgente ? colors.urgent + "15" : colors.backgroundElement,
                  borderColor: urgente ? colors.urgent : colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.urgenteTitleRow}>
                  <Ionicons
                    name="alert-circle"
                    size={18}
                    color={urgente ? colors.urgent : colors.textSecondary}
                  />
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: urgente ? colors.urgent : colors.text }}
                  >
                    Marcar como caso urgente
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  Recomendado si necesita medicación urgente, es muy cachorro o anciano.
                </ThemedText>
              </View>
              <Switch
                value={urgente}
                onValueChange={setUrgente}
                trackColor={{ false: colors.border, true: colors.urgent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* SECCIÓN 1: ¿Quién se perdió? */}
            <View style={[styles.cardSection, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="paw-outline" size={18} color={colors.tint} />
                <ThemedText type="subtitle" style={styles.cardHeaderTitle}>
                  1. Datos de tu mascota
                </ThemedText>
              </View>

              {/* Nombre */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">Nombre de la mascota *</ThemedText>
                <TextInput
                  value={nombreMascota}
                  onChangeText={setNombreMascota}
                  placeholder="Ej: Bobby, Misi, Luna..."
                  placeholderTextColor={colors.textSecondary + "80"}
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              {/* Especie Selector */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">Especie *</ThemedText>
                <View style={styles.chipRow}>
                  {(
                    [
                      { id: "perro", label: "Perro", icon: "paw-outline" },
                      { id: "gato", label: "Gato", icon: "logo-octocat" },
                      { id: "otro", label: "Otro", icon: "help-circle-outline" },
                    ] as const
                  ).map((item) => {
                    const activo = especie === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setEspecie(item.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: activo ? colors.tint : colors.cardMuted,
                            borderColor: activo ? colors.tint : colors.border,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={15}
                          color={activo ? "#FFFFFF" : colors.textSecondary}
                        />
                        <ThemedText
                          type="smallBold"
                          style={{ color: activo ? "#FFFFFF" : colors.text }}
                        >
                          {item.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Foto de la Mascota */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">Foto de la mascota (muy recomendado)</ThemedText>
                {fotoUri ? (
                  <View style={styles.photoPreviewWrap}>
                    <Image source={{ uri: fotoUri }} style={styles.photoPreview} />
                    <Pressable
                      onPress={quitarFoto}
                      style={[styles.removePhotoBtn, { backgroundColor: "#000000AA" }]}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                      <ThemedText style={{ color: "#FFFFFF", fontSize: 12 }}>Quitar</ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={seleccionarFoto}
                    style={[
                      styles.uploadPlaceholder,
                      { borderColor: colors.tint, backgroundColor: colors.tint + "08" },
                    ]}
                  >
                    <Ionicons name="camera-outline" size={28} color={colors.tint} />
                    <ThemedText type="smallBold" themeColor="tint">
                      Subir o tomar una foto
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Ayudará mucho a que la comunidad la reconozca
                    </ThemedText>
                  </Pressable>
                )}
              </View>

              {/* Botón Analizar con IA - solo visible cuando hay foto */}
              {fotoUri && (
                <View style={styles.fieldGroup}>
                  <Pressable
                    onPress={analizarConIA}
                    disabled={analizandoIA}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        paddingVertical: 14,
                        borderRadius: 14,
                        backgroundColor: analizandoIA
                          ? colors.tint + "40"
                          : pressed
                            ? colors.tint + "CC"
                            : colors.tint,
                      },
                    ]}
                  >
                    {analizandoIA ? (
                      <>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <ThemedText style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
                          Analizando con Gemini...
                        </ThemedText>
                      </>
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                        <ThemedText style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
                          Analizar con IA
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                  <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center", marginTop: 4 }}>
                    Gemini Vision detecta raza, color, tamaño y más automáticamente
                  </ThemedText>
                </View>
              )}

              {/* Resultado del análisis de IA */}
              {resultadoIA && (
                <View
                  style={{
                    backgroundColor: colors.tint + "12",
                    borderRadius: 14,
                    padding: 16,
                    gap: 8,
                    borderWidth: 1,
                    borderColor: colors.tint + "30",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                    <ThemedText style={{ fontWeight: "700", fontSize: 14, color: colors.tint }}>
                      Análisis completado con IA
                    </ThemedText>
                  </View>

                  <View style={{ gap: 6, marginTop: 4 }}>
                    {resultadoIA.razaEstimada && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="sparkles-outline" size={14} color={colors.tint} />
                        <ThemedText type="small">
                          <ThemedText type="smallBold">Raza:</ThemedText> {resultadoIA.razaEstimada}
                        </ThemedText>
                      </View>
                    )}
                    {resultadoIA.colorPelaje && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="color-palette-outline" size={14} color={colors.tint} />
                        <ThemedText type="small">
                          <ThemedText type="smallBold">Pelaje:</ThemedText> {resultadoIA.colorPelaje}
                        </ThemedText>
                      </View>
                    )}
                    {resultadoIA.tamano && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="resize-outline" size={14} color={colors.tint} />
                        <ThemedText type="small">
                          <ThemedText type="smallBold">Tamaño:</ThemedText> {resultadoIA.tamano}
                        </ThemedText>
                      </View>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons
                        name={resultadoIA.usaCollar ? "checkmark-circle-outline" : "close-circle-outline"}
                        size={14}
                        color={resultadoIA.usaCollar ? colors.tint : colors.textSecondary}
                      />
                      <ThemedText type="small">
                        {resultadoIA.usaCollar ? "Usa collar" : "Sin collar visible"}
                      </ThemedText>
                    </View>
                    {resultadoIA.senasParticulares && (
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 2 }}>
                        <Ionicons name="information-circle-outline" size={14} color={colors.tint} style={{ marginTop: 2 }} />
                        <ThemedText type="small" style={{ flex: 1, fontStyle: "italic" }}>
                          {resultadoIA.senasParticulares}
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                    Los campos del formulario se completaron automáticamente. Puedes editarlos si lo necesitas.
                  </ThemedText>
                </View>
              )}

              {/* Descripción */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">Descripción y señas particulares *</ThemedText>
                <TextInput
                  value={descripcion}
                  onChangeText={setDescripcion}
                  placeholder="Color del pelaje, tamaño aproximado, manchas, si responde a su nombre..."
                  placeholderTextColor={colors.textSecondary + "80"}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.input,
                    styles.textArea,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                />
              </View>
            </View>

            {/* SECCIÓN 2: Identificación & Salud */}
            <View style={[styles.cardSection, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="pricetag-outline" size={18} color={colors.tint} />
                <ThemedText type="subtitle" style={styles.cardHeaderTitle}>
                  2. Identificación y salud
                </ThemedText>
              </View>

              {/* Collar Toggle */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold">¿Lleva collar puesto?</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Indica si tiene placa o cascabel
                  </ThemedText>
                </View>
                <Switch
                  value={usaCollar}
                  onValueChange={setUsaCollar}
                  trackColor={{ false: colors.border, true: colors.tint }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {usaCollar && (
                <View style={styles.fieldGroup}>
                  <ThemedText type="smallBold">Detalles del collar</ThemedText>
                  <TextInput
                    value={descripcionCollar}
                    onChangeText={setDescripcionCollar}
                    placeholder="Ej: Rojo con placa metálica, cascabel azul..."
                    placeholderTextColor={colors.textSecondary + "80"}
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  />
                </View>
              )}

              {/* Chip Toggle */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold">¿Tiene microchip de identificación?</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Registrado en el Registro Nacional de Mascotas
                  </ThemedText>
                </View>
                <Switch
                  value={tieneChip}
                  onValueChange={setTieneChip}
                  trackColor={{ false: colors.border, true: colors.tint }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Condición Médica */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">Condición médica / cuidados especiales</ThemedText>
                <TextInput
                  value={condicionMedica}
                  onChangeText={setCondicionMedica}
                  placeholder="Ej: Ciega de un ojo, requiere pastillas diarias (opcional)"
                  placeholderTextColor={colors.textSecondary + "80"}
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                />
              </View>
            </View>

            {/* SECCIÓN 3: Ubicación y Contacto */}
            <View style={[styles.cardSection, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="location-outline" size={18} color={colors.tint} />
                <ThemedText type="subtitle" style={styles.cardHeaderTitle}>
                  3. Ubicación y contacto directo
                </ThemedText>
              </View>

              {/* Sector */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">Sector o comuna donde se perdió *</ThemedText>
                <TextInput
                  value={sector}
                  onChangeText={setSector}
                  placeholder="Ej: Manso de Velasco, Melipilla / Plaza de Armas..."
                  placeholderTextColor={colors.textSecondary + "80"}
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              {/* WhatsApp */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold">WhatsApp de contacto *</ThemedText>
                <View
                  style={[
                    styles.phoneInputWrap,
                    { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <Ionicons name="logo-whatsapp" size={20} color={colors.whatsapp} />
                  <TextInput
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                    placeholder="+56 9 1234 5678"
                    placeholderTextColor={colors.textSecondary + "80"}
                    keyboardType="phone-pad"
                    style={[styles.phoneInput, { color: colors.text }]}
                  />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  Quien la aviste podrá enviarte un WhatsApp directo con un solo toque.
                </ThemedText>
              </View>
            </View>

            {/* Error Banner */}
            {errorMsg && (
              <View style={[styles.errorBanner, { backgroundColor: colors.urgent + "15", borderColor: colors.urgent }]}>
                <Ionicons name="alert-circle" size={20} color={colors.urgent} />
                <ThemedText type="smallBold" style={{ color: colors.urgent, flex: 1 }}>
                  {errorMsg}
                </ThemedText>
              </View>
            )}

            {/* Botón de Publicación */}
            <Pressable
              disabled={cargando}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: colors.tint,
                  opacity: cargando ? 0.7 : pressed ? 0.9 : 1,
                  shadowColor: colors.tint,
                },
              ]}
            >
              {cargando ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <ThemedText style={styles.submitBtnText}>Publicando alerta...</ThemedText>
                </>
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.submitBtnText}>Publicar Alerta de Pérdida</ThemedText>
                </>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    paddingVertical: Spacing.two,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  urgenteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: Spacing.two,
  },
  urgenteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  cardSection: {
    padding: Spacing.four,
    borderRadius: 20,
    borderWidth: 1,
    gap: Spacing.three,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: Spacing.one,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
  },
  photoPreviewWrap: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  removePhotoBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  phoneInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: Spacing.one,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.five,
    gap: Spacing.three,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  successMessage: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  successActions: {
    width: "100%",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
});
