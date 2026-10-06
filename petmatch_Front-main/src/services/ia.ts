import type {
  AnalisisIA,
  AnalisisIAResponse,
  CompararForenseRequest,
  InformeForense,
  InformeForenseResponse,
} from "@/types/ai";
import { apiRequest } from "./api";
import { adjuntarFoto } from "./form-data";

/** POST /api/ia/analizar — morfología + triaje veterinario de una foto local. */
export async function analizarFoto(fotoUri: string): Promise<AnalisisIA> {
  const fd = new FormData();
  await adjuntarFoto(fd, fotoUri, "mascota");
  const res = await apiRequest<AnalisisIAResponse>("/api/ia/analizar", { method: "POST", body: fd });
  if (!res.success || !res.analisis) throw new Error("La IA no devolvió un análisis válido.");
  return res.analisis;
}

/** POST /api/ia/comparar-forense — peritaje biométrico entre dos fotos. */
export async function compararForense(req: CompararForenseRequest): Promise<InformeForense> {
  const res = await apiRequest<InformeForenseResponse>("/api/ia/comparar-forense", {
    method: "POST",
    body: { ...req },
  });
  if (!res?.informe) throw new Error("La IA no devolvió un informe forense.");
  return res.informe;
}
