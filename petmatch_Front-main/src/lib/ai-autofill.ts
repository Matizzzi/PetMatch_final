/**
 * Traduce un análisis de IA a valores de formulario (función pura).
 */
import type { AnalisisIA } from "@/types/ai";
import type { Especie } from "@/types/api";
import type { CamposAutocompletables } from "@/types/forms";
import { requiereAtencion, resumenCondicionMedica } from "./triage";

function especieDesdeIA(especie: string): Especie {
  return especie === "perro" || especie === "gato" ? especie : "otro";
}

function descripcionDesdeIA(a: AnalisisIA): string {
  const partes: string[] = [];
  if (a.razaEstimada) partes.push(`Raza estimada: ${a.razaEstimada}`);
  if (a.colorPelaje) partes.push(`Pelaje: ${a.colorPelaje}`);
  if (a.tamano) partes.push(`Tamaño: ${a.tamano}`);
  if (a.senasParticulares) partes.push(a.senasParticulares);
  return partes.length ? `${partes.join(". ")}.` : "";
}

/**
 * Campos a sobrescribir tras un análisis. Solo marca `urgente` (nunca lo
 * desmarca) para no pisar una decisión explícita del usuario.
 */
export function camposDesdeAnalisis(a: AnalisisIA): Partial<CamposAutocompletables> {
  const campos: Partial<CamposAutocompletables> = { especie: especieDesdeIA(a.especie) };

  const descripcion = descripcionDesdeIA(a);
  if (descripcion) campos.descripcion = descripcion;

  if (requiereAtencion(a)) {
    campos.urgente = true;
    const resumen = resumenCondicionMedica(a);
    if (resumen) campos.condicionMedica = resumen;
  }
  return campos;
}
