import { useCallback } from "react";

import type { AnalisisIA } from "@/types/ai";
import { useAiTriage } from "./use-ai-triage";
import { useImagePicker } from "./use-image-picker";

/**
 * Composición foto + IA compartida por los formularios de alerta y avistamiento.
 * `onAnalisis` recibe el resultado para que cada formulario lo aplique a su estado.
 */
export function usePhotoAnalysis(motivoPermiso: string, onAnalisis: (a: AnalisisIA) => void) {
  const ia = useAiTriage();
  const foto = useImagePicker({ motivoPermiso, onQuitar: ia.limpiar });
  const { fotoUri, reset: resetFoto } = foto;
  const { analizar, limpiar } = ia;

  const analizarFotoActual = useCallback(async () => {
    if (!fotoUri) return;
    const analisis = await analizar(fotoUri);
    if (analisis) onAnalisis(analisis);
  }, [fotoUri, analizar, onAnalisis]);

  const reset = useCallback(() => {
    resetFoto();
    limpiar();
  }, [resetFoto, limpiar]);

  return {
    foto,
    analizando: ia.analizando,
    resultado: ia.resultado,
    analizar: analizarFotoActual,
    reset,
  };
}

export type PhotoAnalysisState = ReturnType<typeof usePhotoAnalysis>;
