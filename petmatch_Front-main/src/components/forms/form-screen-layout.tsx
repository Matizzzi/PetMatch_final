import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { FloatingTabBarHeight, Spacing } from "@/constants/theme";

interface FormScreenLayoutProps {
  children: ReactNode;
  /** Separación vertical entre secciones. */
  gap?: number;
}

/** Contenedor común de pantallas de formulario: safe area + teclado + scroll. */
export function FormScreenLayout({ children, gap = Spacing.three }: FormScreenLayoutProps) {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={[styles.content, { gap }]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    paddingBottom: FloatingTabBarHeight + Spacing.six,
  },
});
