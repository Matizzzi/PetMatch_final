import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TEMA_KEY = "petmatch_tema";

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
