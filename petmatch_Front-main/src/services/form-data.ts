import { Platform } from "react-native";

import { asegurarFotoUrlTexto, dataUrlABlob, esDataUrl, esFotoTexto } from "@/lib/image-encoding";

type ValorCampo = string | number | boolean | null | undefined;

/**
 * Adjunta una foto al FormData. Los Data URL van como archivo `foto` para no
 * chocar el límite de 1 MB de Starlette en campos de texto. En Android no se
 * adjunta nunca un `file://` / `content://` (OkHttp aborta esos streams).
 */
export async function adjuntarFoto(fd: FormData, uri: string, nombreBase: string): Promise<void> {
  const uriLimpia = uri?.trim();
  if (!uriLimpia) return;

  if (esDataUrl(uriLimpia)) {
    const blob = dataUrlABlob(uriLimpia);
    const ext = blob.type.includes("png") ? "png" : "jpg";
    fd.append("foto", blob, `${nombreBase}.${ext}`);
    return;
  }

  if (esFotoTexto(uriLimpia)) {
    fd.append("fotoUrl", uriLimpia);
    return;
  }

  try {
    const texto = await asegurarFotoUrlTexto(uriLimpia);
    if (esDataUrl(texto)) {
      const blob = dataUrlABlob(texto);
      const ext = blob.type.includes("png") ? "png" : "jpg";
      fd.append("foto", blob, `${nombreBase}.${ext}`);
      return;
    }
    fd.append("fotoUrl", texto);
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
