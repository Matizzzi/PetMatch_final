import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";

interface AiAnalyzeButtonProps {
  analizando: boolean;
  onPress: () => void;
}

/** Dispara el análisis de la foto con Gemini Vision. */
export function AiAnalyzeButton({ analizando, onPress }: AiAnalyzeButtonProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.group}>
      <Pressable
        onPress={onPress}
        disabled={analizando}
        accessibilityRole="button"
        accessibilityState={{ busy: analizando }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: analizando
              ? colors.tint + "40"
              : pressed
                ? colors.tint + "CC"
                : colors.tint,
          },
        ]}
      >
        {analizando ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        )}
        <ThemedText style={styles.label}>
          {analizando ? "Analizando con Gemini..." : "Analizar con IA"}
        </ThemedText>
      </Pressable>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        Gemini Vision detecta raza, color, tamaño y estado de salud automáticamente
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 4 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  label: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  hint: { textAlign: "center" },
});
