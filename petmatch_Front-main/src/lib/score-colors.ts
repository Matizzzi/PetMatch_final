/**
 * Mapeo de puntajes y veredictos a colores semánticos (funciones puras).
 */
import { SemanticColors } from "@/constants/petmatch";
import type { ThemeColors } from "@/contexts/theme-context";

export function colorScoreMatch(score: number, colors: ThemeColors): string {
  if (score >= 80) return SemanticColors.success;
  if (score >= 60) return SemanticColors.warning;
  return colors.textSecondary;
}

export function colorRasgo(porcentaje: number, colors: ThemeColors): string {
  if (porcentaje >= 80) return colors.whatsapp;
  if (porcentaje >= 50) return colors.tint;
  return colors.urgent;
}

export interface PaletaVeredicto {
  fondo: string;
  borde: string;
  texto: string;
}

export function paletaVeredicto(veredicto: string, colors: ThemeColors): PaletaVeredicto {
  if (veredicto === "ALTA COINCIDENCIA") {
    return { fondo: colors.whatsapp + "20", borde: colors.whatsapp, texto: colors.whatsapp };
  }
  if (veredicto === "COINCIDENCIA MODERADA") {
    return {
      fondo: SemanticColors.warning + "20",
      borde: SemanticColors.warning,
      texto: SemanticColors.warningText,
    };
  }
  return { fondo: colors.urgent + "20", borde: colors.urgent, texto: colors.urgent };
}

/** Limita un porcentaje al rango [min, 100] para el ancho de barras de progreso. */
export const anchoBarra = (valor: number, min = 0) => `${Math.min(100, Math.max(min, valor))}%` as const;
