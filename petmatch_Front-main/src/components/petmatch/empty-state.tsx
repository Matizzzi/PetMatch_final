import { StyleSheet, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";

interface EmptyStateProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onReset?: () => void;
}

export function EmptyState({
  title = "No encontramos coincidencias",
  message = "Intenta buscar con otro nombre o cambia los filtros de categoría.",
  buttonText = "Ver todas las alertas",
  onReset,
}: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundElement,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="search-outline" size={28} color={colors.tint} />
      </View>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText
        type="default"
        themeColor="textSecondary"
        style={styles.message}
      >
        {message}
      </ThemedText>
      {onReset && (
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <ThemedText style={styles.buttonText}>{buttonText}</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: Spacing.five,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.four,
    borderWidth: 1,
    gap: Spacing.two,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.one,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 280,
  },
  button: {
    marginTop: Spacing.two,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
});
