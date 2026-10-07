import { asegurarFotoUrlTexto } from "@/lib/image-encoding";
import type {
  AnalisisIA,
  AnalisisIAResponse,
  CompararForenseRequest,
  InformeForense,
  InformeForenseResponse,
} from "@/types/ai";
import { apiRequest, ApiRequestError } from "./api";

/** Cold start de Render (~50 s) + inferencia de Gemini (5-15 s). */
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

/**
 * POST /api/ia/analizar. Render en producción solo parsea multipart (`fotoUrl` texto).
 * JSON se intenta después por si el backend ya acepta `{ fotoUrl }`.
 * Nunca se envía `file://` / `content://`: OkHttp aborta esos streams en Android.
 */
export async function analizarFoto(fotoUri: string): Promise<AnalisisIA> {
  const fotoUrl = await asegurarFotoUrlTexto(fotoUri);
  const fd = new FormData();
  fd.append("fotoUrl", fotoUrl);
  try {
    return await pedirAnalisis(fd);
  } catch (err) {
    const status = err instanceof ApiRequestError ? err.status : 0;
    if (status !== 400 && status !== 415 && status !== 422) throw err;
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
