import { Ionicons } from "@expo/vector-icons";
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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

let ImagePicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ImagePicker = require("expo-image-picker");
} catch {
  ImagePicker = null;
}

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FloatingTabBarHeight, Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useAppTheme } from "@/contexts/theme-context";
import { apiRequest, ApiRequestError } from "@/services/api";

type EspecieType = "perro" | "gato" | "otro";

const COORDENADAS_DEFAULT = {
  latitud: -33.6869,
  longitud: -71.2149,
};

export default function ReportarScreen() {
  const { colors } = useAppTheme();
  const { usuario } = useAuth();

  // Estados del Formulario de Avistamiento
  const [especie, setEspecie] = useState<EspecieType>("perro");
  const [descripcion, setDescripcion] = useState("");
  const [comuna, setComuna] = useState("Melipilla");
  const [contactoNombre, setContactoNombre] = useState(usuario?.nombre ?? "");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [contactoEmail, setContactoEmail] = useState(usuario?.email ?? "");
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  // Estados de interfaz
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // Selector de imagen
  const seleccionarFoto = async () => {
    if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
      Alert.alert(
        "Aviso",
        "El selector de fotos nativo requiere una Development Build. Puedes continuar y reportar el avistamiento sin foto."
      );
      return;
    }
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        if (Platform.OS !== "web") {
          Alert.alert(
            "Permiso requerido",
            "Necesitamos acceso a tus fotos para subir una imagen del animal avistado."
          );
          return;
        }
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
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

  // Estados de IA Vision
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState<any>(null);

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

        // Construir descripción rica
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

    if (!descripcion.trim()) {
      setErrorMsg("Por favor, ingresa una descripción del animal (color, tamaño, señas).");
      return;
    }

    if (!comuna.trim()) {
      setErrorMsg("Por favor, indica dónde o en qué sector lo viste.");
      return;
    }

    setCargando(true);

    try {
      const formData = new FormData();
      formData.append("especie", especie);
      formData.append("descripcion", descripcion.trim());
      formData.append("latitud", String(COORDENADAS_DEFAULT.latitud));
      formData.append("longitud", String(COORDENADAS_DEFAULT.longitud));
      formData.append("comuna", comuna.trim());

      if (contactoNombre.trim()) {
        formData.append("contactoNombre", contactoNombre.trim());
      }
      if (contactoTelefono.trim()) {
        formData.append("contactoTelefono", contactoTelefono.trim());
      }
      if (contactoEmail.trim()) {
        formData.append("contactoEmail", contactoEmail.trim());
      }

      if (fotoUri) {
        if (Platform.OS === "web") {
          const res = await fetch(fotoUri);
          const blob = await res.blob();
          formData.append("foto", blob, "avistamiento.jpg");
        } else {
          formData.append("foto", {
            uri: fotoUri,
            name: "avistamiento.jpg",
            type: "image/jpeg",
          } as unknown as Blob);
        }
      }

      await apiRequest("/api/avistamientos", {
        method: "POST",
        body: formData,
        auth: !!usuario,
      });

      setExito(true);
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "No se pudo registrar el avistamiento. Revisa que el backend esté conectado.";
      setErrorMsg(msg);
    } finally {
      setCargando(false);
    }
  };

  const reiniciarFormulario = () => {
    setEspecie("perro");
    setDescripcion("");
    setComuna("Melipilla");
    setContactoNombre(usuario?.nombre ?? "");
    setContactoTelefono("");
    setContactoEmail(usuario?.email ?? "");
    setFotoUri(null);
    setErrorMsg(null);
    setExito(false);
  };

  // Vista de éxito
  if (exito) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.successContainer}>
            <View style={[styles.successIconCircle, { backgroundColor: colors.tint + "20" }]}>
              <Ionicons name="sparkles" size={60} color={colors.tint} />
            </View>

            <ThemedText type="title" style={styles.successTitle}>
              ¡Avistamiento Reportado!
            </ThemedText>

            <ThemedText themeColor="textSecondary" style={styles.successMessage}>
              Muchas gracias por colaborar. El motor de PetMatch acaba de comparar
              este avistamiento con las alertas activas de mascotas perdidas cercanas.
            </ThemedText>

            <View style={styles.successActions}>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.tint }]}
                onPress={() => {
                  reiniciarFormulario();
                  router.push("/(tabs)");
                }}
              >
                <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                <ThemedText style={styles.primaryBtnText}>Volver al mapa</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={reiniciarFormulario}
              >
                <ThemedText type="smallBold" themeColor="tint">
                  Reportar otro animal
                </ThemedText>
              </Pressable>
            </View>
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
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.headerBadge, { backgroundColor: "#FFB020" + "20" }]}>
                <Ionicons name="eye" size={16} color="#FFB020" />
                <ThemedText style={{ color: "#FFB020", fontWeight: "700", fontSize: 13 }}>
                  COMUNIDAD
                </ThemedText>
              </View>
              <ThemedText type="title">Reportar Avistamiento</ThemedText>
              <ThemedText themeColor="textSecondary">
                ¿Viste a un perrito o gatito solo en la calle? Repórtalo para cruzar datos y avisar a su dueño.
              </ThemedText>
            </View>

            {/* Error Banner */}
            {errorMsg && (
              <View style={[styles.errorBanner, { backgroundColor: colors.urgent + "18", borderColor: colors.urgent }]}>
                <Ionicons name="alert-circle" size={20} color={colors.urgent} />
                <ThemedText style={[styles.errorText, { color: colors.urgent }]}>
                  {errorMsg}
                </ThemedText>
              </View>
            )}

            {/* Selector de Foto */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">Foto del animal avistado</ThemedText>
              {fotoUri ? (
                <View style={styles.fotoPreviewContainer}>
                  <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                  <Pressable
                    style={[styles.btnQuitarFoto, { backgroundColor: colors.urgent }]}
                    onPress={quitarFoto}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.btnQuitarFotoTexto}>Cambiar foto</ThemedText>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[
                    styles.uploadBox,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundElement,
                    },
                  ]}
                  onPress={seleccionarFoto}
                >
                  <View style={[styles.uploadIconCircle, { backgroundColor: colors.tint + "15" }]}>
                    <Ionicons name="camera-outline" size={32} color={colors.tint} />
                  </View>
                  <ThemedText type="defaultSemiBold">Subir foto del animal</ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    Toma o sube una foto clara para que el dueño lo reconozca
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {/* Botón Analizar con IA */}
            {fotoUri && (
              <View style={styles.section}>
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
                  Los campos se completaron automáticamente. Puedes editarlos.
                </ThemedText>
              </View>
            )}

            {/* Selector de Especie */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">¿Qué animal viste?</ThemedText>
              <View style={styles.especieRow}>
                {(
                  [
                    { id: "perro", label: "Perro", icon: "paw" },
                    { id: "gato", label: "Gato", icon: "logo-octocat" },
                    { id: "otro", label: "Otro", icon: "help-circle-outline" },
                  ] as const
                ).map((item) => {
                  const seleccionado = especie === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.especieBtn,
                        {
                          borderColor: seleccionado ? colors.tint : colors.border,
                          backgroundColor: seleccionado
                            ? colors.tint + "15"
                            : colors.backgroundElement,
                        },
                      ]}
                      onPress={() => setEspecie(item.id)}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={seleccionado ? colors.tint : colors.textSecondary}
                      />
                      <ThemedText
                        style={{
                          color: seleccionado ? colors.tint : colors.text,
                          fontWeight: seleccionado ? "700" : "500",
                        }}
                      >
                        {item.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Dónde lo viste */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">¿Dónde lo viste? (Sector / Comuna)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Ej: Plaza de Armas, cerca de supermercado..."
                placeholderTextColor={colors.textSecondary}
                value={comuna}
                onChangeText={setComuna}
              />
            </View>

            {/* Descripción */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">Descripción del animal</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Describe color, tamaño, si tiene collar, manchas o comportamiento..."
                placeholderTextColor={colors.textSecondary}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Contacto de quien avista */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold">Tus datos de contacto (Opcional)</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                Para que el dueño pueda llamarte o enviarte un mensaje si cree que es su mascota.
              </ThemedText>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                    borderColor: colors.border,
                    marginTop: Spacing.two,
                  },
                ]}
                placeholder="Tu nombre (opcional)"
                placeholderTextColor={colors.textSecondary}
                value={contactoNombre}
                onChangeText={setContactoNombre}
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    color: colors.text,
                    borderColor: colors.border,
                    marginTop: Spacing.two,
                  },
                ]}
                placeholder="Teléfono o WhatsApp (+569...)"
                placeholderTextColor={colors.textSecondary}
                value={contactoTelefono}
                onChangeText={setContactoTelefono}
                keyboardType="phone-pad"
              />
            </View>

            {/* Botón Publicar */}
            <Pressable
              style={[
                styles.submitBtn,
                { backgroundColor: colors.tint },
                cargando && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.submitBtnText}>
                    Publicar Avistamiento y Buscar Match
                  </ThemedText>
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
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  section: {
    gap: Spacing.two,
  },
  especieRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  especieBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.three,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: "center",
    gap: Spacing.two,
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  fotoPreviewContainer: {
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    gap: Spacing.two,
  },
  fotoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  btnQuitarFoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnQuitarFotoTexto: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: Spacing.three + 2,
    borderRadius: 16,
    marginTop: Spacing.two,
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
    padding: Spacing.four,
    gap: Spacing.three,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.two,
  },
  successTitle: {
    fontSize: 24,
    textAlign: "center",
  },
  successMessage: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.two,
  },
  successActions: {
    width: "100%",
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.three + 2,
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
    paddingVertical: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
});
