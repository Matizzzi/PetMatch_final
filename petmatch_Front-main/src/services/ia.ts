import { Platform } from "react-native";

import { asegurarFotoUrlTexto, dataUrlABlob, esDataUrl } from "@/lib/image-encoding";
import type {
  AnalisisIA,
  AnalisisIAResponse,
  CompararForenseRequest,
  InformeForense,
  InformeForenseResponse,
} from "@/types/ai";
import { apiRequest, ApiRequestError } from "./api";

/** Cold start de Render (~50 s) + inferencia de visión (5-15 s). */
const TIMEOUT_IA_MS = 90_000;

async function pedirAnalisis(body: { fotoUrl: string } | FormData): Promise<AnalisisIA> {
  const res = await apiRequest<AnalisisIAResponse>("/api/ia/analizar", {
    method: "POST",
    body,
    timeoutMs: TIMEOUT_IA_MS,
  });
  if (!res.success || !res.analisis) throw new Error("La IA no devolvió un análisis válido.");
  return res.analisis;
}

function armarFormDataFoto(fotoUrl: string): FormData {
  const fd = new FormData();
  if (esDataUrl(fotoUrl)) {
    const blob = dataUrlABlob(fotoUrl);
    const ext = blob.type.includes("png") ? "png" : "jpg";
    fd.append("foto", blob, `mascota.${ext}`);
    return fd;
  }
  fd.append("fotoUrl", fotoUrl);
  return fd;
}

/**
 * POST /api/ia/analizar.
 * En Android/iOS Hermes no soporta `new Blob([Uint8Array])`, así que se manda
 * JSON `{ fotoUrl }` (el backend ya lo acepta). En web va multipart `foto`.
 */
export async function analizarFoto(fotoUri: string): Promise<AnalisisIA> {
  const fotoUrl = await asegurarFotoUrlTexto(fotoUri);
  if (Platform.OS !== "web") {
    return pedirAnalisis({ fotoUrl });
  }
  try {
    return await pedirAnalisis(armarFormDataFoto(fotoUrl));
  } catch (err) {
    const status = err instanceof ApiRequestError ? err.status : 0;
    if (status !== 400 && status !== 413 && status !== 415 && status !== 422) throw err;
    return pedirAnalisis({ fotoUrl });
  }
}

/** POST /api/ia/comparar-forense — peritaje biométrico entre dos fotos. */
export async function compararForense(req: CompararForenseRequest): Promise<InformeForense> {
  const res = await apiRequest<InformeForenseResponse>("/api/ia/comparar-forense", {
    method: "POST",
    body: { ...req },
    timeoutMs: TIMEOUT_IA_MS,
  });
  if (!res?.informe) throw new Error("La IA no devolvió un informe forense.");
  return res.informe;
}
