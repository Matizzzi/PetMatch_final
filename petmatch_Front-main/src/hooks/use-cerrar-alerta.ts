import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { guardarCodigoCierre, obtenerCodigoCierre } from "@/lib/codigos-cierre";
import { mensajeDeError } from "@/lib/errors";
import { resolverAlerta } from "@/services/alertas";
import type { AlertaPerdida } from "@/types/api";

/** Cierra una alerta con el código de publicación, sin iniciar sesión. */
export function useCerrarAlerta(onCerrada: (alerta: AlertaPerdida) => void) {
  const [pendiente, setPendiente] = useState<AlertaPerdida | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = useCallback(
    async (alerta: AlertaPerdida, codigo: string) => {
      setEnviando(true);
      setError(null);
      try {
        const res = await resolverAlerta(alerta.id, codigo);
        guardarCodigoCierre(alerta.id, codigo);
        setPendiente(null);
        onCerrada(res.alerta);
      } catch (err) {
        setError(mensajeDeError(err, "No se pudo cerrar la alerta. Revisa el código."));
        if (!pendiente) {
          Alert.alert("No se pudo cerrar", mensajeDeError(err, "Revisa el código e inténtalo de nuevo."));
        }
      } finally {
        setEnviando(false);
      }
    },
    [onCerrada, pendiente],
  );

  const pedirCierre = useCallback(
    (alerta: AlertaPerdida) => {
      const guardado = obtenerCodigoCierre(alerta.id);
      if (guardado) {
        Alert.alert(
          "¿Ya volvió a casa?",
          `Se va a marcar a ${alerta.mascota.nombre} como reencontrado.`,
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Sí, ya volvió", onPress: () => void enviar(alerta, guardado) },
          ],
        );
        return;
      }
      setError(null);
      setPendiente(alerta);
    },
    [enviar],
  );

  const confirmarConCodigo = useCallback(
    (codigo: string) => {
      if (!pendiente) return;
      void enviar(pendiente, codigo);
    },
    [enviar, pendiente],
  );

  const cancelar = useCallback(() => {
    if (enviando) return;
    setPendiente(null);
    setError(null);
  }, [enviando]);

  return { pendiente, enviando, error, pedirCierre, confirmarConCodigo, cancelar };
}
