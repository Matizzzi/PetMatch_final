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
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: FormData | Record<string, unknown>;
  auth?: boolean; // si true, adjunta el token de sesión
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "true",
  };
  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
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

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: requestBody,
    });
  } catch {
    // Si la conexión local falló, reintentar automáticamente contra Render en la nube
    const renderFallback = "https://petmatch-backend-japt.onrender.com";
    if (API_URL !== renderFallback) {
      try {
        response = await fetch(`${renderFallback}${path}`, {
          method,
          headers,
          body: requestBody,
        });
      } catch {
        throw new ApiRequestError(
          "No se pudo conectar con el servidor. Revisa tu conexión.",
          0,
        );
      }
    } else {
      throw new ApiRequestError(
        "No se pudo conectar con el servidor. Revisa tu conexión.",
        0,
      );
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiRequestError(
      data?.error || "Ocurrió un error inesperado",
      response.status,
    );
  }

  return data as T;
}
