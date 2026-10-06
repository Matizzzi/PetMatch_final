import { useEffect, useState } from "react";

import { MIN_MATCH_SCORE } from "@/constants/petmatch";
import { obtenerMatchesDeAlerta } from "@/services/matches";
import type { AlertaPerdida, Match } from "@/types/api";

/**
 * Carga los matches de una alerta mientras `activo` sea true.
 * Descarta respuestas tardías si la alerta cambia o el modal se cierra.
 */
export function useMatches(alerta: AlertaPerdida | null, activo: boolean) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activo || !alerta) return;
    let cancelado = false;

    async function cargar(alertaId: string) {
      setCargando(true);
      setError(null);
      try {
        const res = await obtenerMatchesDeAlerta(alertaId, MIN_MATCH_SCORE);
        if (!cancelado) setMatches(res.matches ?? []);
      } catch {
        if (!cancelado) setError("No se pudieron cargar los matches.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar(alerta.id);
    return () => {
      cancelado = true;
    };
  }, [activo, alerta]);

  return { matches, cargando, error };
}
