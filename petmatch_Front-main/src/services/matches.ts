import type { MatchesResponse } from "@/types/api";
import { apiRequest } from "./api";

/** GET /api/matches — coincidencias de una alerta sobre un puntaje mínimo. */
export function obtenerMatchesDeAlerta(alertaId: string, minScore: number): Promise<MatchesResponse> {
  const params = `alertaId=${encodeURIComponent(alertaId)}&minScore=${minScore}`;
  return apiRequest<MatchesResponse>(`/api/matches?${params}`);
}
