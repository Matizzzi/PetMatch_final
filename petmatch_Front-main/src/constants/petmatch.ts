import type { Especie } from "@/types/api";
import type { Coordenadas } from "@/types/requests";
import type { IoniconName } from "@/types/ui";

/** Centro de Melipilla: ubicación por defecto mientras no se integre GPS. */
export const COORDENADAS_DEFAULT: Coordenadas = {
  latitud: -33.6869,
  longitud: -71.2149,
};

export const SECTOR_DEFAULT = "Melipilla";

/** Puntaje mínimo (0-100) para mostrar un match al dueño. */
export const MIN_MATCH_SCORE = 40;

export const FOTO_MASCOTA_FALLBACK =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800";

export interface OpcionEspecie {
  id: Especie;
  label: string;
  icon: IoniconName;
}

export const ESPECIE_OPCIONES: readonly OpcionEspecie[] = [
  { id: "perro", label: "Perro", icon: "paw-outline" },
  { id: "gato", label: "Gato", icon: "logo-octocat" },
  { id: "otro", label: "Otro", icon: "help-circle-outline" },
];

/** Colores semánticos independientes del tema claro/oscuro. */
export const SemanticColors = {
  danger: "#DC2626",
  warning: "#F59E0B",
  warningText: "#D97706",
  success: "#10B981",
  successText: "#059669",
  safe: "#16A34A",
} as const;
