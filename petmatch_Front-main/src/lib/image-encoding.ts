import type * as ImageManipulatorModule from "expo-image-manipulator";
import type { ImagePickerAsset, ImagePickerOptions } from "expo-image-picker";

type ImageManipulatorApi = typeof ImageManipulatorModule;

/** Lado mayor máximo: suficiente para pelaje y marcas, ~150-300 KB en JPEG. */
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

export function esDataUrl(uri: string): boolean {
  return uri.startsWith("data:");
}

/** Data URL ya lista en el asset, sin tocar el sistema de archivos. */
export function dataUrlDesdeAsset(asset: ImagePickerAsset): string | null {
  if (esDataUrl(asset.uri) && asset.uri.includes(",")) return asset.uri;
  if (asset.base64) return `data:${mimeDeDataUrlOAsset(asset)};base64,${asset.base64}`;
  return null;
}

export function esFotoTexto(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://") || esDataUrl(uri);
}

/** Convierte un Data URL a Blob para enviarlo como archivo multipart (`foto`). */
export function dataUrlABlob(dataUrl: string): Blob {
  const coma = dataUrl.indexOf(",");
  if (coma < 0) throw new Error("Data URL de imagen inválida.");
  const header = dataUrl.slice(0, coma);
  const b64 = dataUrl.slice(coma + 1);
  const mime = /data:([^;]+)/.exec(header)?.[1] || "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime.startsWith("image/") ? mime : "image/jpeg" });
}

async function uriADataUrlViaFetch(uri: string): Promise<string | null> {
  if (typeof fetch === "undefined" || typeof FileReader === "undefined") return null;
  try {
    const res = await fetch(uri);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size) return null;
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function comprimirViaCanvas(uri: string): Promise<string | null> {
  if (typeof document === "undefined" || typeof window === "undefined") return null;
  const Ctor = window.Image;
  if (!Ctor) return null;

  return new Promise((resolve) => {
    const img = new Ctor();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const lado = Math.max(img.width, img.height) || 1;
      const escala = Math.min(1, MAX_LADO_FOTO / lado);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * escala));
      canvas.height = Math.max(1, Math.round(img.height * escala));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL("image/jpeg", CALIDAD_FOTO));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = uri;
  });
}

/** Redimensiona (lado mayor ≤ MAX_LADO_FOTO) y recodifica en JPEG como Data URL. */
export async function comprimirADataUrl(uri: string): Promise<string | null> {
  if (Manipulator) {
    const { manipulateAsync, SaveFormat, ImageManipulator } = Manipulator;
    try {
      if (typeof manipulateAsync === "function") {
        const result = await manipulateAsync(
          uri,
          [{ resize: { width: MAX_LADO_FOTO } }],
          { compress: CALIDAD_FOTO, format: SaveFormat.JPEG, base64: true },
        );
        if (result.base64) return `data:image/jpeg;base64,${result.base64}`;
      } else if (ImageManipulator) {
        const context = ImageManipulator.manipulate(uri);
        context.resize({ width: MAX_LADO_FOTO });
        const imagen = await context.renderAsync();
        const { base64 } = await imagen.saveAsync({
          format: SaveFormat.JPEG,
          compress: CALIDAD_FOTO,
          base64: true,
        });
        if (base64) return `data:image/jpeg;base64,${base64}`;
      }
    } catch (err) {
      console.warn("[PetMatch] expo-image-manipulator no pudo comprimir:", err);
    }
  }

  return comprimirViaCanvas(uri);
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

  const desdeUri = await uriADataUrlViaFetch(asset.uri);
  if (desdeUri) return desdeUri;

  throw new Error("No se pudo leer la foto seleccionada. Intenta con otra imagen.");
}

/** Garantiza un Data URL o URL http(s). Nunca devuelve una URI nativa de Android. */
export async function asegurarFotoUrlTexto(uri: string): Promise<string> {
  const limpia = uri.trim();
  if (!limpia) throw new Error("No hay una foto para enviar.");

  if (esFotoTexto(limpia)) {
    const comprimida = await comprimirADataUrl(limpia);
    if (comprimida) return comprimida;
    if (esDataUrl(limpia)) return limpia;
    const materializada = await uriADataUrlViaFetch(limpia);
    if (materializada) return materializada;
    return limpia;
  }

  try {
    const dataUrl = await comprimirADataUrl(limpia);
    if (dataUrl) return dataUrl;
  } catch (err) {
    console.warn("[PetMatch] No se pudo convertir la URI local a Base64:", err);
  }

  const desdeFetch = await uriADataUrlViaFetch(limpia);
  if (desdeFetch) return desdeFetch;

  throw new Error(
    "No se pudo preparar la foto para enviarla (Android no permite adjuntar file://). Elige o toma la foto de nuevo.",
  );
}
