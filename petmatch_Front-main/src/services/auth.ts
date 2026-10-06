import { Usuario } from "@/types/api";
import { apiRequest } from "./api";
import { borrarToken, guardarToken, obtenerToken } from "./storage";

interface AuthResponse {
  success: boolean;
  usuario: Usuario;
  token: string;
}

export async function login(email: string, password: string): Promise<Usuario> {
  const data = await apiRequest<AuthResponse>("/api/auth", {
    method: "POST",
    body: { email, password },
  });
  await guardarToken(data.token);
  return data.usuario;
}

export async function registrar(
  email: string,
  password: string,
  nombre: string,
): Promise<Usuario> {
  const data = await apiRequest<AuthResponse>("/api/auth", {
    method: "POST",
    body: { email, password, nombre },
  });
  await guardarToken(data.token);
  return data.usuario;
}

export async function logout(): Promise<void> {
  await borrarToken();
}
export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  try {
    const token = await obtenerToken();
    if (!token) return null;

    const data = await apiRequest<{ usuario: Usuario }>("/api/me", {
      auth: true,
    });
    return data.usuario;
  } catch {
    return null;
  }
}
