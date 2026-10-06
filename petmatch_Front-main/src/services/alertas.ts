import type { AlertaCreateResponse } from "@/types/api";
import type { CrearAlertaRequest } from "@/types/requests";
import { apiRequest } from "./api";
import { adjuntarFoto, crearFormData } from "./form-data";

/** POST /api/alertas — publica una alerta de mascota perdida. */
export async function crearAlerta(
  { fotoUri, ...campos }: CrearAlertaRequest,
  conSesion: boolean,
): Promise<AlertaCreateResponse> {
  const fd = crearFormData({ ...campos });
  if (fotoUri) await adjuntarFoto(fd, fotoUri, "mascota");
  return apiRequest<AlertaCreateResponse>("/api/alertas", {
    method: "POST",
    body: fd,
    auth: conSesion,
  });
}
