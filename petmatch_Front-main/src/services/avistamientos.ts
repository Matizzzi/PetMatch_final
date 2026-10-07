import type { AvistamientoCreateResponse } from "@/types/api";
import type { CrearAvistamientoRequest } from "@/types/requests";
import { apiRequest } from "./api";
import { adjuntarFoto, crearFormData } from "./form-data";

/** POST /api/avistamientos — registra un avistamiento y dispara el matching. */
export async function crearAvistamiento(
  { fotoUri, ...campos }: CrearAvistamientoRequest,
  conSesion: boolean,
): Promise<AvistamientoCreateResponse> {
  const fd = crearFormData({ ...campos });
  if (fotoUri) await adjuntarFoto(fd, fotoUri, "avistamiento");
  return apiRequest<AvistamientoCreateResponse>("/api/avistamientos", {
    method: "POST",
    body: fd,
    auth: conSesion,
    timeoutMs: 60_000,
  });
}
