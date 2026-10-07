import { Platform } from "react-native";
import { obtenerToken } from "./storage";

const PRODUCTION_API_URL = "https://petmatch-backend-japt.onrender.com";

function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      // Si corre en localhost o 127.0.0.1 en web
      if (host === "localhost" || host === "127.0.0.1") {
        return envUrl && !envUrl.includes("onrender.com") ? envUrl : "http://localhost:8000";
      }
      // Si corre en red local (ej. 192.168.x.x, 10.x.x.x, 172.x.x.x)
      if (/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))/.test(host)) {
        return `http://${host}:8000`;
      }
    }
    return envUrl || PRODUCTION_API_URL;
  }

  if (envUrl) {
    return envUrl;
  }

  return PRODUCTION_API_URL;
}

const API_URL = resolveApiUrl();

export function resolveFotoUrl(url?: string | null): string | null {
  if (!url) return null;
  // Si es un Data URL en Base64 (almacenado directamente en Neon DB), retornar tal cual
  if (url.startsWith("data:image/")) {
    return url;
  }
  const currentApi = resolveApiUrl();

  // Si la URL guardada en DB tiene localhost:8000 pero estamos accediendo desde otra IP o Render
  if (url.includes("localhost:8000")) {
    return url.replace("http://localhost:8000", currentApi);
  }
  // Si la URL viene con IP local pero estamos en localhost web
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return url.replace(/http:\/\/(192\.168|10\.|172\.(?:1[6-9]|2\d|3[01]))\.\d+\.\d+:8000/, "http://localhost:8000");
    }
  }
  return url;
}

export class ApiRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiRequestError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: FormData | Record<string, unknown>;
  auth?: boolean; // si true, adjunta el token de sesión
  /** Tiempo máximo por intento. Render (plan gratuito) puede tardar ~50 s en despertar. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 45_000;
export const STATUS_SIN_CONEXION = 0;
export const STATUS_TIMEOUT = 408;

const MENSAJE_SIN_CONEXION = "No se pudo conectar con el servidor. Revisa tu conexión a internet.";
const MENSAJE_TIMEOUT =
  "El servidor tardó demasiado en responder (puede estar iniciándose). Intenta de nuevo en unos segundos.";
const MENSAJE_OKHTTP =
  "No se pudo enviar la foto. Vuelve a tomarla o elígela de la galería e inténtalo de nuevo.";

class TimeoutError extends Error {}

function esFormData(body: unknown): body is FormData {
  return !!body && typeof (body as FormData).append === "function";
}

async function fetchConTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) throw new TimeoutError();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Extrae el mensaje real del backend: `detail` de FastAPI (string o lista de validación) o `error`. */
function mensajeDelBackend(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const { detail, error, mensaje, message } = data as Record<string, unknown>;
    if (typeof detail === "string" && detail) return detail;
    if (Array.isArray(detail) && detail.length) {
      return detail
        .map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : String(d)))
        .join(". ");
    }
    if (typeof error === "string" && error) return error;
    if (typeof mensaje === "string" && mensaje) return mensaje;
    if (typeof message === "string" && message) return message;
  }
  if (typeof data === "string" && data.trim() && !data.trimStart().startsWith("<")) return data.trim();
  if (status === 413) return "La imagen es demasiado grande. Intenta con otra foto.";
  if (status >= 500) return `El servidor tuvo un problema (HTTP ${status}). Intenta de nuevo en unos segundos.`;
  return `Ocurrió un error inesperado (HTTP ${status}).`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
  };
  let requestBody: BodyInit | undefined;

  // En Hermes/Android `instanceof FormData` a veces falla y JSON.stringify(FormData)
  // manda "{}": FastAPI no ve foto ni fotoUrl y responde 400.
  if (esFormData(body)) {
    requestBody = body;
    // No seteamos Content-Type: fetch lo arma solo con el boundary correcto para FormData
  } else if (body) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  if (auth) {
    const token = await obtenerToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const init: RequestInit = { method, headers, body: requestBody };
  const intentar = async (baseUrl: string): Promise<Response> => {
    try {
      return await fetchConTimeout(`${baseUrl}${path}`, init, timeoutMs);
    } catch (err) {
      if (err instanceof TimeoutError) {
        console.warn(`[PetMatch API] Timeout (${timeoutMs} ms) en ${method} ${baseUrl}${path}`);
        throw new ApiRequestError(MENSAJE_TIMEOUT, STATUS_TIMEOUT);
      }
      console.warn(`[PetMatch API] Falló petición a ${baseUrl}${path}:`, err);
      const raw = err instanceof Error ? err.message : "";
      throw new ApiRequestError(
        /network request failed/i.test(raw) ? MENSAJE_OKHTTP : MENSAJE_SIN_CONEXION,
        STATUS_SIN_CONEXION,
      );
    }
  };

  let response: Response;
  try {
    response = await intentar(API_URL);
  } catch (err) {
    // Solo ante falla de red (no timeout) se reintenta contra Render, p. ej. si el backend local está apagado.
    const sinConexion = err instanceof ApiRequestError && err.status === STATUS_SIN_CONEXION;
    if (!sinConexion || API_URL === PRODUCTION_API_URL) throw err;
    response = await intentar(PRODUCTION_API_URL);
  }

  const texto = await response.text().catch(() => "");
  let data: unknown = texto;
  try {
    data = texto ? JSON.parse(texto) : {};
  } catch {
    // Respuesta no JSON (p. ej. página HTML 502 de Render): se conserva el texto.
  }

  if (!response.ok) {
    throw new ApiRequestError(mensajeDelBackend(data, response.status), response.status);
  }

  return data as T;
}
