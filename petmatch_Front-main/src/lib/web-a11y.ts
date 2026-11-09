import { Platform } from "react-native";

/**
 * En web, accessibilityRole="button" se vuelve <button>. Text/View de RN son <div>,
 * y <button><div> es HTML inválido: el navegador reescribe el DOM y React 19 lanza #418.
 */
export const webSafeButtonRole = Platform.OS === "web" ? undefined : ("button" as const);
