import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "petmatch_token";
const TEMA_KEY = "petmatch_tema";

const memoryStorage: Record<string, string> = {};

export async function guardarToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, token);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    memoryStorage[TOKEN_KEY] = token;
  }
}

export async function obtenerToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return memoryStorage[TOKEN_KEY] ?? null;
  }
}

export async function borrarToken(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function guardarTema(tema: "light" | "dark"): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TEMA_KEY, tema);
    }
    return;
  }
  await SecureStore.setItemAsync(TEMA_KEY, tema);
}

export async function obtenerTema(): Promise<"light" | "dark" | null> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      const valor = window.localStorage.getItem(TEMA_KEY);
      return valor === "dark" ? "dark" : valor === "light" ? "light" : null;
    }
    return null;
  }
  const valor = await SecureStore.getItemAsync(TEMA_KEY);
  return valor === "dark" ? "dark" : valor === "light" ? "light" : null;
}
