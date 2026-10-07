import { Platform } from "react-native";

/** Forma en que React Native (iOS/Android) representa un archivo dentro de FormData. */
interface NativeFilePart {
  uri: string;
  name: string;
  type: string;
}

type ValorCampo = string | number | boolean | null | undefined;

/**
 * Adjunta una foto local bajo el campo `foto`, resolviendo la diferencia
 * entre Web (requiere Blob), URLs remotas (se pasan como `fotoUrl`) y nativo (acepta `{ uri, name, type }`).
 */
export async function adjuntarFoto(fd: FormData, uri: string, nombreBase: string): Promise<void> {
  if (!uri) return;

  const uriLimpia = uri.trim();

  // Caso 1: Si es una URL remota (http/https) o Base64 Data URL, no es un archivo local del dispositivo.
  // Se envía directamente como el campo 'fotoUrl' que el backend de FastAPI ya soporta y decodifica.
  if (
    uriLimpia.startsWith("http://") ||
    uriLimpia.startsWith("https://") ||
    uriLimpia.startsWith("data:image/")
  ) {
    fd.append("fotoUrl", uriLimpia);
    return;
  }

  // Caso 2: Web (requiere Blob real)
  if (Platform.OS === "web") {
    try {
      const blob = await (await fetch(uriLimpia)).blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      fd.append("foto", blob, `${nombreBase}.${ext}`);
      return;
    } catch {
      fd.append("fotoUrl", uriLimpia);
      return;
    }
  }

  // Caso 3: Nativo (Android / iOS)
  // Extraemos extensión de forma segura evitando URIs como content://... que no tienen punto
  let ext = "jpg";
  const pathWithoutQuery = uriLimpia.split("?")[0].toLowerCase();
  if (pathWithoutQuery.endsWith(".png")) {
    ext = "png";
  } else if (pathWithoutQuery.endsWith(".webp")) {
    ext = "webp";
  } else if (pathWithoutQuery.endsWith(".jpeg") || pathWithoutQuery.endsWith(".jpg")) {
    ext = "jpg";
  }

  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const parte: NativeFilePart = {
    uri: uriLimpia,
    name: `${nombreBase}.${ext}`,
    type,
  };

  // El tipado de FormData es el del DOM; RN acepta este objeto en tiempo de ejecución.
  fd.append("foto", parte as unknown as Blob);
}

/** Construye FormData omitiendo valores nulos/indefinidos. Booleanos viajan como "true"/"false". */
export function crearFormData(campos: Record<string, ValorCampo>): FormData {
  const fd = new FormData();
  for (const [clave, valor] of Object.entries(campos)) {
    if (valor !== undefined && valor !== null) fd.append(clave, String(valor));
  }
  return fd;
}
