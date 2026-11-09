import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { webSafeButtonRole } from "@/lib/web-a11y";

interface AiAnalyzeButtonProps {
  analizando: boolean;
  onPress: () => void;
}

/** Dispara el análisis automático de la foto. */
export function AiAnalyzeButton({ analizando, onPress }: AiAnalyzeButtonProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.group}>
      <Pressable
        onPress={onPress}
        disabled={analizando}
        accessibilityRole={webSafeButtonRole}
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
          {analizando ? "Analizando foto..." : "Analizar con IA"}
        </ThemedText>
      </Pressable>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        Detecta pelaje y completa la descripción. Con Groq o Gemini también estima raza.
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
