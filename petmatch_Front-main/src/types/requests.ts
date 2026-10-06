/**
 * DTOs de escritura. Los servicios los serializan a multipart/form-data
 * respetando los nombres de campo que espera FastAPI.
 */
import type { Especie } from "./api";

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface CrearAlertaRequest extends Coordenadas {
  nombreMascota: string;
  especie: Especie;
  descripcion: string;
  sector: string;
  urgente: boolean;
  usaCollar: boolean;
  descripcionCollar?: string;
  tieneChip: boolean;
  condicionMedica?: string;
  whatsapp: string;
  /** URI local (file://, blob:, data:) de la foto seleccionada. */
  fotoUri?: string | null;
}

export interface CrearAvistamientoRequest extends Coordenadas {
  especie: Especie;
  descripcion: string;
  comuna: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
  fotoUri?: string | null;
}
