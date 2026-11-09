import { useCallback, useState } from "react";

import { SECTOR_DEFAULT } from "@/constants/petmatch";
import { camposDesdeAnalisis } from "@/lib/ai-autofill";
import { guardarCodigoCierre } from "@/lib/codigos-cierre";
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
  const { values, setField, patch, reset } = useFormState(crearValoresIniciales);

  const [publicando, setPublicando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alertaCreada, setAlertaCreada] = useState<AlertaPerdida | null>(null);
  const [codigoCierre, setCodigoCierre] = useState<string | null>(null);

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
      const res = await crearAlerta(request, false);
      const alerta = res?.alerta ?? alertaProvisional(request, null);
      setAlertaCreada(alerta);
      if (res?.codigoCierre) {
        setCodigoCierre(res.codigoCierre);
        guardarCodigoCierre(alerta.id, res.codigoCierre);
      }
    } catch (err) {
      setErrorMsg(
        mensajeDeError(err, "No se pudo publicar la alerta. Inténtalo de nuevo en unos segundos.", true),
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
    setCodigoCierre(null);
  };

  return {
    values,
    setField,
    fotoIA,
    publicando,
    errorMsg,
    alertaCreada,
    codigoCierre,
    publicar,
    reiniciar,
  };
}
