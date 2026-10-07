import { Platform } from "react-native";

import { asegurarFotoUrlTexto, esFotoTexto } from "@/lib/image-encoding";

type ValorCampo = string | number | boolean | null | undefined;

/**
 * Adjunta una foto al FormData como texto en `fotoUrl` (Data URL o URL remota).
 * En Android no se adjunta nunca un archivo `file://` / `content://`: OkHttp
 * lanza "TypeError: Network request failed" al leer esos streams (Scoped Storage).
 */
export async function adjuntarFoto(fd: FormData, uri: string, nombreBase: string): Promise<void> {
  const uriLimpia = uri?.trim();
  if (!uriLimpia) return;

  if (esFotoTexto(uriLimpia)) {
    fd.append("fotoUrl", uriLimpia);
    return;
  }

  try {
    fd.append("fotoUrl", await asegurarFotoUrlTexto(uriLimpia));
    return;
  } catch (err) {
    if (Platform.OS !== "web") throw err;
    console.warn("[PetMatch] Conversión a Base64 falló, se envía el blob web:", err);
  }

  const blob = await (await fetch(uriLimpia)).blob();
  const ext = blob.type.includes("png") ? "png" : "jpg";
  fd.append("foto", blob, `${nombreBase}.${ext}`);
}

/** Construye FormData omitiendo valores nulos/indefinidos. Booleanos viajan como "true"/"false". */
export function crearFormData(campos: Record<string, ValorCampo>): FormData {
  const fd = new FormData();
  for (const [clave, valor] of Object.entries(campos)) {
    if (valor !== undefined && valor !== null) fd.append(clave, String(valor));
  }
  return fd;
}
