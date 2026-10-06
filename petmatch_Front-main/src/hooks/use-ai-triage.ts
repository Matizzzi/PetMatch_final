import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { mensajeDeError } from "@/lib/errors";
import { analizarFoto } from "@/services/ia";
import type { AnalisisIA } from "@/types/ai";

/**
 * Orquesta el análisis de una foto con Gemini Vision (morfología + triaje).
 * Devuelve el resultado para que cada formulario decida qué autocompletar.
 */
export function useAiTriage() {
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalisisIA | null>(null);

  const analizar = useCallback(async (fotoUri: string): Promise<AnalisisIA | null> => {
    setAnalizando(true);
    setResultado(null);
    try {
      const analisis = await analizarFoto(fotoUri);
      setResultado(analisis);
      return analisis;
    } catch (err) {
      Alert.alert(
        "Error de IA",
        mensajeDeError(err, "No se pudo analizar la imagen. Intenta de nuevo."),
      );
      return null;
    } finally {
      setAnalizando(false);
    }
  }, []);

  const limpiar = useCallback(() => setResultado(null), []);

  return { analizando, resultado, analizar, limpiar };
}

export type AiTriageState = ReturnType<typeof useAiTriage>;
