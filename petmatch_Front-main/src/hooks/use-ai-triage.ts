import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { mensajeDeError } from "@/lib/errors";
import { analizarFoto } from "@/services/ia";
import { ApiRequestError } from "@/services/api";
import type { AnalisisIA } from "@/types/ai";

/**
 * Orquesta el análisis de una foto (morfología + triaje).
 * Devuelve el resultado para que cada formulario decida qué autocompletar.
 */
export function useAiTriage() {
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalisisIA | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analizar = useCallback(async (fotoUri: string): Promise<AnalisisIA | null> => {
    setAnalizando(true);
    setResultado(null);
    setError(null);
    try {
      const analisis = await analizarFoto(fotoUri);
      setResultado(analisis);
      return analisis;
    } catch (err) {
      const mensaje = mensajeDeError(err, "No se pudo analizar la imagen. Intenta de nuevo.");
      setError(mensaje);
      const titulo =
        err instanceof ApiRequestError && (err.status === 422 || err.status === 429)
          ? err.status === 429
            ? "Límite de IA"
            : "Foto no apta"
          : "Error de IA";
      Alert.alert(titulo, mensaje);
      return null;
    } finally {
      setAnalizando(false);
    }
  }, []);

  const limpiar = useCallback(() => {
    setResultado(null);
    setError(null);
  }, []);

  return { analizando, resultado, error, analizar, limpiar };
}

export type AiTriageState = ReturnType<typeof useAiTriage>;
