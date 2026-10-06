import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";
import type { IoniconName } from "@/types/ui";

interface SuccessViewProps {
  icon: IoniconName;
  title: string;
  message: ReactNode;
  /** Botones de acción posteriores al envío. */
  children: ReactNode;
}

/** Pantalla de confirmación tras publicar un formulario. */
export function SuccessView({ icon, title, message, children }: SuccessViewProps) {
  const { colors } = useAppTheme();

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.container}>
          <View style={[styles.iconCircle, { backgroundColor: colors.tint + "20" }]}>
            <Ionicons name={icon} size={62} color={colors.tint} />
          </View>
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.message}>
            {message}
          </ThemedText>
          <View style={styles.actions}>{children}</View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.five,
    gap: Spacing.three,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  message: { textAlign: "center", fontSize: 15, lineHeight: 22, maxWidth: 320 },
  actions: { width: "100%", gap: Spacing.two, marginTop: Spacing.two },
});
