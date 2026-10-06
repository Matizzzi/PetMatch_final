import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { IoniconName } from "@/types/ui";

interface ScreenHeaderProps {
  icon: IoniconName;
  color: string;
  title: string;
  subtitle: string;
}

/** Encabezado de pantalla de formulario con ícono destacado. */
export function ScreenHeader({ icon, color, title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.row} accessibilityRole="header">
      <View style={[styles.badge, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.texts}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.two, paddingVertical: Spacing.two },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  texts: { flex: 1 },
  title: { fontSize: 24, fontWeight: "800" },
});
