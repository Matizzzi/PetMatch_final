/**
 * Validación y transformación de estados de formulario a DTOs de request.
 */
import { COORDENADAS_DEFAULT } from "@/constants/petmatch";
import type { AlertaPerdida, Usuario } from "@/types/api";
import type { AlertaFormValues, AvistamientoFormValues } from "@/types/forms";
import type { CrearAlertaRequest, CrearAvistamientoRequest } from "@/types/requests";

const opcional = (valor: string): string | undefined => valor.trim() || undefined;

// ---------- Alerta de pérdida ----------

export function validarAlerta(v: AlertaFormValues): string | null {
  if (!v.nombreMascota.trim()) return "Por favor, ingresa el nombre de tu mascota.";
  if (!v.descripcion.trim())
    return "Por favor, describe a tu mascota (color, tamaño, señas particulares).";
  if (!v.sector.trim()) return "Por favor, indica el sector o comuna donde se extravió.";
  if (!v.whatsapp.trim()) return "Ingresa un número de WhatsApp para que puedan contactarte.";
  return null;
}

export function aRequestDeAlerta(v: AlertaFormValues, fotoUri: string | null): CrearAlertaRequest {
  return {
    ...COORDENADAS_DEFAULT,
    nombreMascota: v.nombreMascota.trim(),
    especie: v.especie,
    descripcion: v.descripcion.trim(),
    sector: v.sector.trim(),
    urgente: v.urgente,
    usaCollar: v.usaCollar,
    descripcionCollar: v.usaCollar ? opcional(v.descripcionCollar) : undefined,
    tieneChip: v.tieneChip,
    condicionMedica: opcional(v.condicionMedica),
    whatsapp: v.whatsapp.trim(),
    fotoUri,
  };
}

/** Alerta local para el afiche cuando el backend no devuelve la entidad creada. */
export function alertaProvisional(req: CrearAlertaRequest, usuario: Usuario | null): AlertaPerdida {
  const ahora = new Date().toISOString();
  const usuarioId = usuario?.id ?? "temp";
  return {
    id: `temp_${Date.now()}`,
    mascotaId: "temp",
    usuarioId,
    latitud: req.latitud,
    longitud: req.longitud,
    sector: req.sector,
    urgente: req.urgente,
    whatsapp: req.whatsapp,
    fechaPerdida: ahora,
    activa: true,
    createdAt: ahora,
    mascota: {
      id: "temp",
      nombre: req.nombreMascota,
      especie: req.especie,
      descripcion: req.descripcion,
      fotoUrl: req.fotoUri,
      usaCollar: req.usaCollar,
      descripcionCollar: req.descripcionCollar,
      tieneChip: req.tieneChip,
      condicionMedica: req.condicionMedica,
      usuarioId,
    },
  };
}

// ---------- Avistamiento ----------

export function validarAvistamiento(v: AvistamientoFormValues): string | null {
  if (!v.descripcion.trim())
    return "Por favor, ingresa una descripción del animal (color, tamaño, señas).";
  if (!v.comuna.trim()) return "Por favor, indica dónde o en qué sector lo viste.";
  return null;
}

/**
 * El endpoint de avistamientos no tiene columnas de urgencia/condición médica,
 * por eso viajan embebidas en la descripción (visible para el dueño y el matching).
 */
export function aRequestDeAvistamiento(
  v: AvistamientoFormValues,
  fotoUri: string | null,
): CrearAvistamientoRequest {
  const condicion = v.condicionMedica.trim();
  const descripcion = [
    v.urgente ? "[URGENTE]" : "",
    v.descripcion.trim(),
    condicion ? `Condición médica: ${condicion}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ...COORDENADAS_DEFAULT,
    especie: v.especie,
    descripcion,
    comuna: v.comuna.trim(),
    contactoNombre: opcional(v.contactoNombre),
    contactoTelefono: opcional(v.contactoTelefono),
    contactoEmail: opcional(v.contactoEmail),
    fotoUri,
  };
}
