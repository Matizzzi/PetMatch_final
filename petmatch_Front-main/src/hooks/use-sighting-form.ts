import { useCallback, useState } from "react";

import { SECTOR_DEFAULT } from "@/constants/petmatch";
import { useAuth } from "@/contexts/auth-context";
import { camposDesdeAnalisis } from "@/lib/ai-autofill";
import { mensajeDeError } from "@/lib/errors";
import { aRequestDeAvistamiento, validarAvistamiento } from "@/lib/form-builders";
import { crearAvistamiento } from "@/services/avistamientos";
import type { AnalisisIA } from "@/types/ai";
import type { Usuario } from "@/types/api";
import type { AvistamientoFormValues } from "@/types/forms";
import { useFormState } from "./use-form-state";
import { usePhotoAnalysis } from "./use-photo-analysis";

/** Los datos de contacto se precargan con los del usuario autenticado. */
const crearValoresIniciales = (usuario: Usuario | null): AvistamientoFormValues => ({
  especie: "perro",
  descripcion: "",
  comuna: SECTOR_DEFAULT,
  contactoNombre: usuario?.nombre ?? "",
  contactoTelefono: "",
  contactoEmail: usuario?.email ?? "",
  urgente: false,
  condicionMedica: "",
});

/**
 * Lógica del formulario "Reportar avistamiento": estado, IA, validación y envío.
 */
export function useSightingForm() {
  const { usuario } = useAuth();
  const { values, setField, patch, reset } = useFormState(() => crearValoresIniciales(usuario));

  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const aplicarAnalisis = useCallback((a: AnalisisIA) => patch(camposDesdeAnalisis(a)), [patch]);

  const fotoIA = usePhotoAnalysis(
    "Necesitamos acceso a tus fotos para subir una imagen del animal avistado.",
    aplicarAnalisis,
  );

  const enviar = async () => {
    setErrorMsg(null);
    const error = validarAvistamiento(values);
    if (error) {
      setErrorMsg(error);
      return;
    }

    setEnviando(true);
    try {
      await crearAvistamiento(aRequestDeAvistamiento(values, fotoIA.foto.fotoUri), !!usuario);
      setExito(true);
    } catch (err) {
      setErrorMsg(
        mensajeDeError(
          err,
          "No se pudo registrar el avistamiento. Revisa que el backend esté conectado.",
          true,
        ),
      );
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    reset(crearValoresIniciales(usuario));
    fotoIA.reset();
    setErrorMsg(null);
    setExito(false);
  };

  return { values, setField, fotoIA, enviando, errorMsg, exito, enviar, reiniciar };
}
