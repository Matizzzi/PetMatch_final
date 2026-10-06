import { useCallback, useState } from "react";

import { SECTOR_DEFAULT } from "@/constants/petmatch";
import { useAuth } from "@/contexts/auth-context";
import { camposDesdeAnalisis } from "@/lib/ai-autofill";
import { mensajeDeError } from "@/lib/errors";
import { alertaProvisional, aRequestDeAlerta, validarAlerta } from "@/lib/form-builders";
import { crearAlerta } from "@/services/alertas";
import type { AnalisisIA } from "@/types/ai";
import type { AlertaPerdida } from "@/types/api";
import type { AlertaFormValues } from "@/types/forms";
import { useFormState } from "./use-form-state";
import { usePhotoAnalysis } from "./use-photo-analysis";

const crearValoresIniciales = (): AlertaFormValues => ({
  nombreMascota: "",
  especie: "perro",
  descripcion: "",
  sector: SECTOR_DEFAULT,
  whatsapp: "",
  usaCollar: false,
  descripcionCollar: "",
  tieneChip: false,
  condicionMedica: "",
  urgente: false,
});

/**
 * Lógica completa del formulario "Se me perdió": estado, autocompletado por IA,
 * validación y publicación. La pantalla solo renderiza lo que este hook expone.
 */
export function useAlertForm() {
  const { usuario } = useAuth();
  const { values, setField, patch, reset } = useFormState(crearValoresIniciales);

  const [publicando, setPublicando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alertaCreada, setAlertaCreada] = useState<AlertaPerdida | null>(null);

  const aplicarAnalisis = useCallback(
    (a: AnalisisIA) => {
      patch({
        ...camposDesdeAnalisis(a),
        ...(a.usaCollar !== undefined && { usaCollar: a.usaCollar }),
      });
    },
    [patch],
  );

  const fotoIA = usePhotoAnalysis(
    "Necesitamos acceso a tus fotos para subir una imagen de tu mascota.",
    aplicarAnalisis,
  );

  const publicar = async () => {
    setErrorMsg(null);
    const error = validarAlerta(values);
    if (error) {
      setErrorMsg(error);
      return;
    }

    setPublicando(true);
    try {
      const request = aRequestDeAlerta(values, fotoIA.foto.fotoUri);
      const res = await crearAlerta(request, !!usuario);
      setAlertaCreada(res?.alerta ?? alertaProvisional(request, usuario));
    } catch (err) {
      setErrorMsg(
        mensajeDeError(err, "No se pudo publicar la alerta. Revisa que el backend esté conectado.", true),
      );
    } finally {
      setPublicando(false);
    }
  };

  const reiniciar = () => {
    reset(crearValoresIniciales());
    fotoIA.reset();
    setErrorMsg(null);
    setAlertaCreada(null);
  };

  return {
    usuario,
    values,
    setField,
    fotoIA,
    publicando,
    errorMsg,
    alertaCreada,
    publicar,
    reiniciar,
  };
}
