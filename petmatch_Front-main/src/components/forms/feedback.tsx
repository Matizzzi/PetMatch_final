import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";
import type { IoniconName } from "@/types/ui";

/** Banner de error de validación o de red. */
export function ErrorBanner({ message }: { message: string }) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.urgent + "15", borderColor: colors.urgent }]}
    >
      <Ionicons name="alert-circle" size={20} color={colors.urgent} />
      <ThemedText type="smallBold" style={[styles.flex, { color: colors.urgent }]}>
        {message}
      </ThemedText>
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: IoniconName;
  loading?: boolean;
  loadingLabel?: string;
  /** primary: relleno con `color`; secondary: contorno. */
  variant?: "primary" | "secondary";
  color?: string;
}

/** Botón principal de acciones de formulario con estado de carga. */
export function ActionButton({
  label,
  onPress,
  icon,
  loading = false,
  loadingLabel,
  variant = "primary",
  color,
}: ActionButtonProps) {
  const { colors } = useAppTheme();
  const fondo = color ?? colors.tint;
  const esPrimario = variant === "primary";

  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: loading }}
      style={({ pressed }) => [
        styles.button,
        esPrimario
          ? { backgroundColor: fondo, opacity: loading ? 0.7 : pressed ? 0.9 : 1 }
          : { borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={esPrimario ? "#FFFFFF" : fondo} size="small" />
      ) : (
        icon && <Ionicons name={icon} size={18} color={esPrimario ? "#FFFFFF" : fondo} />
      )}
      <ThemedText
        type={esPrimario ? "defaultSemiBold" : "smallBold"}
        style={{ color: esPrimario ? "#FFFFFF" : fondo }}
      >
        {loading && loadingLabel ? loadingLabel : label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  flex: { flex: 1 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: 14,
    borderRadius: 16,
  },
});
