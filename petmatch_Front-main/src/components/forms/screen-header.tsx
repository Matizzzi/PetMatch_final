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
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.texts}>
        <ThemedText type="title" style={styles.title} numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
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
  title: { fontSize: 22, fontWeight: "800", flexShrink: 1 },
});
