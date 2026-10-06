import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";

interface EmergencyToggleProps {
  title: string;
  hint: string;
  value: boolean;
  onValueChange: (valor: boolean) => void;
}

/** Interruptor de urgencia: la tarjeta completa se tiñe de rojo al activarse. */
export function EmergencyToggle({ title, hint, value, onValueChange }: EmergencyToggleProps) {
  const { colors } = useAppTheme();
  const acento = value ? colors.urgent : colors.textSecondary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: value ? colors.urgent + "15" : colors.backgroundElement,
          borderColor: value ? colors.urgent : colors.border,
        },
      ]}
    >
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <Ionicons name="alert-circle" size={18} color={acento} />
          <ThemedText type="defaultSemiBold" style={{ color: value ? colors.urgent : colors.text }}>
            {title}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.urgent }}
        thumbColor="#FFFFFF"
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: Spacing.two,
  },
  texts: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
});
