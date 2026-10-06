/**
 * Contratos de los endpoints de IA (`/api/ia/*`), respaldados por Gemini Vision.
 */

export type NivelUrgencia = "ALTA" | "MEDIA" | "BAJA";

export interface CondicionCorporal {
  /** Escala 1 (desnutrición) a 5 (obesidad); 3 es peso normal. */
  puntaje: number;
  descripcion: string;
}

/** Triaje veterinario incluido en el análisis de una foto. */
export interface TriajeIA {
  condicionCorporal?: CondicionCorporal | null;
  lesionesVisibles?: boolean;
  descripcionLesiones?: string | null;
  nivelUrgencia?: NivelUrgencia;
}

/** Resultado de POST /api/ia/analizar. */
export interface AnalisisIA extends TriajeIA {
  especie: string;
  razaEstimada?: string;
  colorPelaje?: string;
  tamano?: string;
  usaCollar?: boolean;
  descripcionCollar?: string | null;
  senasParticulares?: string;
  descripcionSugerida?: string;
  modeloUtilizado?: string;
}

export interface AnalisisIAResponse {
  success: boolean;
  analisis: AnalisisIA;
}

// ---------- Peritaje forense ----------

export interface CompararForenseRequest {
  fotoMascotaUrl: string;
  fotoAvistamientoUrl: string;
  nombreMascota?: string;
  especie?: string;
}

export interface RasgoForense {
  nombre: string;
  porcentaje: number;
  observacion: string;
}

export type VeredictoForense = "ALTA COINCIDENCIA" | "COINCIDENCIA MODERADA" | "BAJA COINCIDENCIA";

export interface InformeForense {
  porcentajeBiometrico: number;
  /** Se tipa como string abierto porque el modelo podría responder variantes. */
  veredicto: VeredictoForense | string;
  nivelConfianza: string;
  resumenEjecutivo: string;
  rasgosAnalizados: RasgoForense[];
  factoresCalle?: string[];
  recomendacion: string;
  modeloUtilizado?: string;
}

export interface InformeForenseResponse {
  success: boolean;
  informe: InformeForense;
}
