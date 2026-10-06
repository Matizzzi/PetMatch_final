/**
 * Estado local de los formularios (valores tal como los edita el usuario,
 * antes de normalizarlos a DTOs de request).
 */
import type { Especie } from "./api";

/** Setter tipado campo a campo: el valor debe corresponder al tipo de la clave. */
export type FieldSetter<T> = <K extends keyof T>(campo: K, valor: T[K]) => void;

/** Props estándar de una sección presentacional de formulario. */
export interface FormSectionProps<T> {
  values: T;
  setField: FieldSetter<T>;
}

/** Campos que la IA puede autocompletar en cualquier formulario con foto. */
export interface CamposAutocompletables {
  especie: Especie;
  descripcion: string;
  urgente: boolean;
  condicionMedica: string;
}

export interface AlertaFormValues extends CamposAutocompletables {
  nombreMascota: string;
  sector: string;
  whatsapp: string;
  usaCollar: boolean;
  descripcionCollar: string;
  tieneChip: boolean;
}

export interface AvistamientoFormValues extends CamposAutocompletables {
  comuna: string;
  contactoNombre: string;
  contactoTelefono: string;
  contactoEmail: string;
}
