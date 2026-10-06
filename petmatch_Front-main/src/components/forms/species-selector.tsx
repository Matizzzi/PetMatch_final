import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ESPECIE_OPCIONES } from "@/constants/petmatch";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";
import type { Especie } from "@/types/api";

interface SpeciesSelectorProps {
  label: string;
  value: Especie;
  onChange: (especie: Especie) => void;
}

/** Selector de especie en chips (perro / gato / otro). */
export function SpeciesSelector({ label, value, onChange }: SpeciesSelectorProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.group}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={styles.row} accessibilityRole="radiogroup">
        {ESPECIE_OPCIONES.map((opcion) => {
          const activo = value === opcion.id;
          return (
            <Pressable
              key={opcion.id}
              onPress={() => onChange(opcion.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
              style={[
                styles.chip,
                {
                  backgroundColor: activo ? colors.tint : colors.cardMuted,
                  borderColor: activo ? colors.tint : colors.border,
                },
              ]}
            >
              <Ionicons
                name={opcion.icon}
                size={15}
                color={activo ? "#FFFFFF" : colors.textSecondary}
              />
              <ThemedText type="smallBold" style={{ color: activo ? "#FFFFFF" : colors.text }}>
                {opcion.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.one },
  row: { flexDirection: "row", gap: Spacing.two },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
