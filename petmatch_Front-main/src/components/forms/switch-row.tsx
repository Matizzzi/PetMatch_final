import { StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";

interface SwitchRowProps {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (valor: boolean) => void;
}

/** Fila etiqueta + interruptor para opciones booleanas del formulario. */
export function SwitchRow({ label, hint, value, onValueChange }: SwitchRowProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.tint }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  texts: { flex: 1 },
});
