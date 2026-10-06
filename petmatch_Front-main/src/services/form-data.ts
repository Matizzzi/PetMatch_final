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
 * entre Web (requiere Blob) y nativo (acepta `{ uri, name, type }`).
 */
export async function adjuntarFoto(fd: FormData, uri: string, nombreBase: string): Promise<void> {
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    fd.append("foto", blob, `${nombreBase}.jpg`);
    return;
  }

  const ext = uri.split(".").pop()?.toLowerCase() === "png" ? "png" : "jpg";
  const parte: NativeFilePart = {
    uri,
    name: `${nombreBase}.${ext}`,
    type: ext === "png" ? "image/png" : "image/jpeg",
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
