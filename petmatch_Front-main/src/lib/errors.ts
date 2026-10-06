import { ApiRequestError } from "@/services/api";

/**
 * Mensaje legible para mostrar al usuario.
 * Con `soloApi` se ignoran errores de red/JS genéricos y se usa el fallback.
 */
export function mensajeDeError(err: unknown, fallback: string, soloApi = false): string {
  if (err instanceof ApiRequestError) return err.message;
  if (!soloApi && err instanceof Error && err.message) return err.message;
  return fallback;
}
