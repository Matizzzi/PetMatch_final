import type { ReactNode } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";

interface FormFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  /** Elemento a la izquierda del input (p. ej. ícono de WhatsApp). */
  leading?: ReactNode;
}

/** Input de texto con etiqueta, ayuda opcional y estilos del tema. */
export function FormField({ label, hint, leading, multiline, ...inputProps }: FormFieldProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.group}>
      {label && <ThemedText type="smallBold">{label}</ThemedText>}
      <View
        style={[
          styles.inputWrap,
          { borderColor: colors.border, backgroundColor: colors.backgroundElement },
        ]}
      >
        {leading}
        <TextInput
          placeholderTextColor={colors.textSecondary + "80"}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[styles.input, multiline && styles.textArea, { color: colors.text }]}
          {...inputProps}
        />
      </View>
      {hint && (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.one },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
  input: { flex: 1, paddingVertical: 10, fontSize: 15 },
  textArea: { minHeight: 80 },
});
