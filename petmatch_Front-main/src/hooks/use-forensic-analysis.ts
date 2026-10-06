import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { resolveFotoUrl } from "@/services/api";
import { compararForense } from "@/services/ia";
import type { InformeForense } from "@/types/ai";
import type { AlertaPerdida, ReporteAvistamiento } from "@/types/api";

const urlAbsoluta = (url?: string | null) => resolveFotoUrl(url) || url || "";

/**
 * Peritajes biométricos por match. Los informes se cachean por `matchId`
 * durante la vida del modal para no repetir llamadas costosas a Gemini.
 */
export function useForensicAnalysis() {
  const [informes, setInformes] = useState<Record<string, InformeForense>>({});
  const [cargando, setCargando] = useState<Record<string, boolean>>({});

  const solicitar = useCallback(
    async (matchId: string, alerta: AlertaPerdida, avistamiento: ReporteAvistamiento) => {
      setCargando((prev) => ({ ...prev, [matchId]: true }));
      try {
        const informe = await compararForense({
          fotoMascotaUrl: urlAbsoluta(alerta.mascota.fotoUrl),
          fotoAvistamientoUrl: urlAbsoluta(avistamiento.fotoUrl),
          nombreMascota: alerta.mascota.nombre,
          especie: alerta.mascota.especie,
        });
        setInformes((prev) => ({ ...prev, [matchId]: informe }));
      } catch {
        Alert.alert(
          "Análisis Forense",
          "No se pudo completar el análisis pericial con IA en este momento. Inténtalo nuevamente.",
        );
      } finally {
        setCargando((prev) => ({ ...prev, [matchId]: false }));
      }
    },
    [],
  );

  return { informes, cargando, solicitar };
}
