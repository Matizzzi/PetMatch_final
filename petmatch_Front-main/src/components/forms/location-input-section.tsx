import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { COORDENADAS_DEFAULT } from "@/constants/petmatch";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";
import type { Coordenadas } from "@/types/requests";
import { FormField } from "./form-field";

interface LocationInputSectionProps {
  label: string;
  placeholder: string;
  sector: string;
  onSectorChange: (sector: string) => void;
  /** Punto que se enviará al backend para el cálculo de distancia del matching. */
  coordenadas?: Coordenadas;
}

/**
 * Sector/comuna en texto libre + indicador del punto geográfico de referencia.
 * Punto de extensión: reemplazar `coordenadas` por la posición de `expo-location`.
 */
export function LocationInputSection({
  label,
  placeholder,
  sector,
  onSectorChange,
  coordenadas = COORDENADAS_DEFAULT,
}: LocationInputSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.group}>
      <FormField label={label} placeholder={placeholder} value={sector} onChangeText={onSectorChange} />
      <View style={styles.coords}>
        <Ionicons name="navigate-circle-outline" size={14} color={colors.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">
          Punto de referencia: {coordenadas.latitud.toFixed(4)}, {coordenadas.longitud.toFixed(4)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.one },
  coords: { flexDirection: "row", alignItems: "center", gap: 4 },
});
