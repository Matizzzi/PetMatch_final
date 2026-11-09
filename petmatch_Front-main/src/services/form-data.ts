import { Platform } from "react-native";

import { asegurarFotoUrlTexto, dataUrlABlob, esDataUrl, esFotoTexto } from "@/lib/image-encoding";

type ValorCampo = string | number | boolean | null | undefined;

function appendFotoDesdeDataUrl(fd: FormData, dataUrl: string, nombreBase: string): void {
  // Hermes/Android no acepta Blob desde ArrayBuffer ("Creating blobs from
  // 'ArrayBuffer' and 'ArrayBufferView' are not supported"). El backend ya
  // recibe `fotoUrl` como Data URL en el multipart.
  if (Platform.OS !== "web") {
    fd.append("fotoUrl", dataUrl);
    return;
  }
  const blob = dataUrlABlob(dataUrl);
  const ext = blob.type.includes("png") ? "png" : "jpg";
  fd.append("foto", blob, `${nombreBase}.${ext}`);
}

/**
 * Adjunta una foto al FormData. En web los Data URL van como archivo `foto`
 * (Starlette corta campos de texto a 1 MB). En nativo viajan en `fotoUrl`.
 */
export async function adjuntarFoto(fd: FormData, uri: string, nombreBase: string): Promise<void> {
  const uriLimpia = uri?.trim();
  if (!uriLimpia) return;

  if (esDataUrl(uriLimpia)) {
    appendFotoDesdeDataUrl(fd, uriLimpia, nombreBase);
    return;
  }

  if (esFotoTexto(uriLimpia)) {
    fd.append("fotoUrl", uriLimpia);
    return;
  }

  try {
    const texto = await asegurarFotoUrlTexto(uriLimpia);
    if (esDataUrl(texto)) {
      appendFotoDesdeDataUrl(fd, texto, nombreBase);
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
