import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";
import type { IoniconName } from "@/types/ui";

interface FormCardProps {
  icon: IoniconName;
  title: string;
  children: ReactNode;
}

/** Tarjeta que agrupa una sección numerada de un formulario. */
export function FormCard({ icon, title, children }: FormCardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <Ionicons name={icon} size={18} color={colors.tint} />
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.four, borderRadius: 20, borderWidth: 1, gap: Spacing.three },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "700", marginBottom: Spacing.one },
});
