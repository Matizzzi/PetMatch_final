import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

/** Nombre de ícono válido de Ionicons (evita castear a `any`). */
export type IoniconName = ComponentProps<typeof Ionicons>["name"];
