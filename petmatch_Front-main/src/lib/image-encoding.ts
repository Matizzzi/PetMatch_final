import type * as ImageManipulatorModule from "expo-image-manipulator";
import type { ImagePickerAsset, ImagePickerOptions } from "expo-image-picker";

type ImageManipulatorApi = typeof ImageManipulatorModule;

/** Lado mayor máximo: suficiente para que Gemini distinga pelaje y marcas, ~150-300 KB en JPEG. */
export const MAX_LADO_FOTO = 1280;
export const CALIDAD_FOTO = 0.7;

/**
 * Opciones compartidas por galería y cámara (Expo SDK 57 ImagePicker).
 * `base64: true` es el respaldo que evita leer `file://` / `content://` en Android.
 */
export const OPCIONES_PICKER_FOTO: ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [4, 3],
  quality: CALIDAD_FOTO,
  base64: true,
  exif: false,
};

function cargarImageManipulator(): ImageManipulatorApi | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("expo-image-manipulator") as ImageManipulatorApi;
    if (mod?.manipulateAsync || mod?.ImageManipulator) return mod;
    return null;
  } catch (err: unknown) {
    console.warn("[PetMatch] expo-image-manipulator no disponible:", err instanceof Error ? err.message : err);
    return null;
  }
}

const Manipulator = cargarImageManipulator();

function mimeDeDataUrlOAsset(asset: ImagePickerAsset): string {
  if (asset.mimeType?.startsWith("image/")) return asset.mimeType;
  if (asset.uri.startsWith("data:image/png")) return "image/png";
  if (asset.uri.startsWith("data:image/webp")) return "image/webp";
  return "image/jpeg";
}

/** Data URL ya lista en el asset, sin tocar el sistema de archivos. */
export function dataUrlDesdeAsset(asset: ImagePickerAsset): string | null {
  if (asset.uri.startsWith("data:image/")) return asset.uri;
  if (asset.base64) return `data:${mimeDeDataUrlOAsset(asset)};base64,${asset.base64}`;
  return null;
}

export function esFotoTexto(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("data:image/");
}

/** Redimensiona (lado mayor ≤ MAX_LADO_FOTO) y recodifica en JPEG como Data URL. */
export async function comprimirADataUrl(uri: string): Promise<string | null> {
  if (!Manipulator) return null;
  const { manipulateAsync, SaveFormat, ImageManipulator } = Manipulator;

  if (typeof manipulateAsync === "function") {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_LADO_FOTO } }],
      { compress: CALIDAD_FOTO, format: SaveFormat.JPEG, base64: true },
    );
    return result.base64 ? `data:image/jpeg;base64,${result.base64}` : null;
  }

  if (!ImageManipulator) return null;
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: MAX_LADO_FOTO });
  const imagen = await context.renderAsync();
  const { base64 } = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: CALIDAD_FOTO, base64: true });
  return base64 ? `data:image/jpeg;base64,${base64}` : null;
}

/**
 * Convierte la foto en un Data URL JPEG autocontenido.
 * Prioriza el Base64 del picker para que `fetch` nunca abra `file://` / `content://`
 * (origen de "TypeError: Network request failed" en OkHttp / Android).
 */
export async function assetADataUrl(asset: ImagePickerAsset): Promise<string> {
  const desdePicker = dataUrlDesdeAsset(asset);
  const origen = desdePicker ?? asset.uri;

  try {
    const dataUrl = await comprimirADataUrl(origen);
    if (dataUrl) return dataUrl;
  } catch (err) {
    console.warn("[PetMatch] No se pudo redimensionar la foto, se usa la original:", err);
  }

  if (desdePicker) return desdePicker;
  throw new Error("No se pudo leer la foto seleccionada. Intenta con otra imagen.");
}

/** Garantiza un Data URL o URL http(s). Nunca devuelve una URI nativa de Android. */
export async function asegurarFotoUrlTexto(uri: string): Promise<string> {
  const limpia = uri.trim();
  if (!limpia) throw new Error("No hay una foto para enviar.");
  if (esFotoTexto(limpia)) return limpia;

  try {
    const dataUrl = await comprimirADataUrl(limpia);
    if (dataUrl) return dataUrl;
  } catch (err) {
    console.warn("[PetMatch] No se pudo convertir la URI local a Base64:", err);
  }

  throw new Error(
    "No se pudo preparar la foto para enviarla (Android no permite adjuntar file://). Elige o toma la foto de nuevo.",
  );
}
