import type * as ImagePickerModule from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";

import { assetADataUrl, OPCIONES_PICKER_FOTO } from "@/lib/image-encoding";

type ImagePickerApi = typeof ImagePickerModule;
type OrigenFoto = "library" | "camera";

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
  } catch (err: unknown) {
    console.warn("[PetMatch] Error cargando expo-image-picker:", err instanceof Error ? err.message : err);
    return null;
  }
}

const ImagePicker = cargarImagePicker();

const FOTO_PRUEBA =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop";

interface UseImagePickerOptions {
  /** Texto que explica por qué se piden permisos de galería. */
  motivoPermiso: string;
  /** Se invoca al quitar la foto (p. ej. para descartar un análisis de IA previo). */
  onQuitar?: () => void;
}

export function useImagePicker({ motivoPermiso, onQuitar }: UseImagePickerOptions) {
  /** Data URL `data:image/jpeg;base64,...` (o URL https de prueba), nunca un `file://`. */
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const ofrecerFotoDePrueba = useCallback(() => {
    Alert.alert(
      "Modo de Prueba (Expo Go)",
      "El selector nativo de fotos requiere el APK instalado.\n\n¿Deseas cargar una foto de mascota de prueba para la IA y los matches?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cargar foto de prueba", onPress: () => setFotoUri(FOTO_PRUEBA) },
      ],
    );
  }, []);

  const abrirPicker = useCallback(
    async (origen: OrigenFoto) => {
      if (!ImagePicker) {
        ofrecerFotoDePrueba();
        return;
      }

      try {
        if (origen === "camera") {
          if (!ImagePicker.launchCameraAsync) {
            ofrecerFotoDePrueba();
            return;
          }
          const permiso = await ImagePicker.requestCameraPermissionsAsync();
          if (!permiso.granted && Platform.OS !== "web") {
            Alert.alert("Permiso requerido", "Necesitamos la cámara para fotografiar a la mascota.");
            return;
          }
        } else {
          const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permiso.granted && Platform.OS !== "web") {
            Alert.alert("Permiso requerido", motivoPermiso);
            return;
          }
        }

        const resultado =
          origen === "camera"
            ? await ImagePicker.launchCameraAsync(OPCIONES_PICKER_FOTO)
            : await ImagePicker.launchImageLibraryAsync(OPCIONES_PICKER_FOTO);

        const asset = resultado.canceled ? undefined : resultado.assets[0];
        if (!asset) return;

        setFotoUri(await assetADataUrl(asset));
      } catch (err) {
        console.warn("Error al abrir el selector de fotos:", err);
        Alert.alert(
          "No se pudo cargar la foto",
          err instanceof Error ? err.message : "Intenta con otra imagen.",
        );
      }
    },
    [motivoPermiso, ofrecerFotoDePrueba],
  );

  const seleccionarFoto = useCallback(() => {
    if (!ImagePicker?.launchImageLibraryAsync && !ImagePicker?.launchCameraAsync) {
      ofrecerFotoDePrueba();
      return;
    }

    // En web Alert.alert no muestra bien varios botones; la galería es el flujo natural.
    if (Platform.OS === "web") {
      void abrirPicker("library");
      return;
    }

    Alert.alert("Foto de la mascota", "¿Cómo quieres agregar la foto?", [
      { text: "Cámara", onPress: () => void abrirPicker("camera") },
      { text: "Galería", onPress: () => void abrirPicker("library") },
      { text: "Cancelar", style: "cancel" },
    ]);
  }, [abrirPicker, ofrecerFotoDePrueba]);

  const quitarFoto = useCallback(() => {
    setFotoUri(null);
    onQuitar?.();
  }, [onQuitar]);

  const reset = useCallback(() => setFotoUri(null), []);

  return { fotoUri, seleccionarFoto, quitarFoto, reset };
}

export type ImagePickerState = ReturnType<typeof useImagePicker>;
