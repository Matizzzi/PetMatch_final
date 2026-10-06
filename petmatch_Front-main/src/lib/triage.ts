/**
 * Reglas de negocio del triaje veterinario (funciones puras, sin React).
 */
import type { NivelUrgencia, TriajeIA } from "@/types/ai";

/** Un caso requiere atención si la IA lo clasifica ALTA o detecta lesiones. */
export function requiereAtencion(t: TriajeIA): boolean {
  return t.nivelUrgencia === "ALTA" || t.lesionesVisibles === true;
}

/**
 * Nivel a mostrar en la UI: si el modelo dijo BAJA pero vio lesiones,
 * se eleva a MEDIA para no transmitir una falsa sensación de normalidad.
 */
export function nivelVisible(t: TriajeIA): NivelUrgencia {
  if (t.nivelUrgencia === "BAJA" && t.lesionesVisibles) return "MEDIA";
  return t.nivelUrgencia ?? "BAJA";
}

/** Texto para autocompletar el campo "condición médica". */
export function resumenCondicionMedica(t: TriajeIA): string {
  const partes: string[] = [];
  if (t.descripcionLesiones) partes.push(t.descripcionLesiones);
  if (t.condicionCorporal && t.condicionCorporal.puntaje !== 3) {
    partes.push(
      `Condición corporal ${t.condicionCorporal.puntaje}/5: ${t.condicionCorporal.descripcion}`,
    );
  }
  return partes.join(". ");
}
