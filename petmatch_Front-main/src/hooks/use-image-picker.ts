import type * as ImagePickerModule from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";

type ImagePickerApi = typeof ImagePickerModule;

/**
 * Carga diferida y tolerante a fallos: si el módulo nativo no está presente
 * en el binario (p. ej. una build antigua), la app sigue funcionando sin fotos.
 */
function cargarImagePicker(): ImagePickerApi | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-image-picker");
    const api = (mod?.launchImageLibraryAsync ? mod : mod?.default) as ImagePickerApi;
    return api || null;
  } catch (err: any) {
    console.warn("[PetMatch] Error cargando expo-image-picker:", err?.message || err);
    return null;
  }
}

const ImagePicker = cargarImagePicker();

interface UseImagePickerOptions {
  /** Texto que explica por qué se piden permisos de galería. */
  motivoPermiso: string;
  /** Se invoca al quitar la foto (p. ej. para descartar un análisis de IA previo). */
  onQuitar?: () => void;
}

export function useImagePicker({ motivoPermiso, onQuitar }: UseImagePickerOptions) {
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const seleccionarFoto = useCallback(async () => {
    if (!ImagePicker?.launchImageLibraryAsync) {
      Alert.alert(
        "Modo de Prueba (Expo Go)",
        "El selector de la galería nativa de tu teléfono requiere el APK instalado en tu celular.\n\nPara que puedas probar la pantalla, la IA y los matches ahora mismo, ¿deseas cargar una foto de mascota de prueba?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cargar foto de prueba",
            onPress: () => {
              setFotoUri(
                "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop"
              );
            },
          },
        ]
      );
      return;
    }
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      // En web el navegador gestiona el acceso; solo se bloquea en nativo.
      if (!permiso.granted && Platform.OS !== "web") {
        Alert.alert("Permiso requerido", motivoPermiso);
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      const uri = resultado.canceled ? undefined : resultado.assets[0]?.uri;
      if (uri) setFotoUri(uri);
    } catch (err) {
      console.warn("Error al abrir galería:", err);
    }
  }, [motivoPermiso]);

  const quitarFoto = useCallback(() => {
    setFotoUri(null);
    onQuitar?.();
  }, [onQuitar]);

  const reset = useCallback(() => setFotoUri(null), []);

  return { fotoUri, seleccionarFoto, quitarFoto, reset };
}

export type ImagePickerState = ReturnType<typeof useImagePicker>;
