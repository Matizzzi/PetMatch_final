export interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

export interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  descripcion: string;
  fotoUrl?: string | null;
  usaCollar: boolean;
  descripcionCollar?: string | null;
  tieneChip: boolean;
  condicionMedica?: string | null;
  usuarioId: string;
}

export interface AlertaPerdida {
  id: string;
  mascotaId: string;
  usuarioId: string;
  latitud: number;
  longitud: number;
  sector?: string | null;
  urgente: boolean;
  whatsapp?: string | null;
  fechaPerdida: string;
  activa: boolean;
  createdAt: string;
  mascota: Mascota;
}

export interface ReporteAvistamiento {
  id: string;
  especie: string;
  descripcion: string;
  fotoUrl: string;
  latitud: number;
  longitud: number;
  comuna?: string | null;
  contactoNombre?: string | null;
  contactoTelefono?: string | null;
  contactoEmail?: string | null;
  procesado?: boolean;
  fechaAvistamiento: string;
  createdAt: string;
}

export interface Match {
  id: string;
  alertaPerdidaId: string;
  reporteAvistamientoId: string;
  scoreDistancia: number;
  scoreTiempo: number;
  scoreTexto: number;
  scoreTotal: number;
  notificado: boolean;
  createdAt: string;
  alerta?: AlertaPerdida;
  avistamiento?: ReporteAvistamiento;
}

export interface MatchesResponse {
  total: number;
  matches: Match[];
}

export interface ApiError {
  error: string;
}

