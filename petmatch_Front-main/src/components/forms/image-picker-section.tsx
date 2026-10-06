import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";

interface ImagePickerSectionProps {
  label: string;
  placeholderTitle: string;
  placeholderHint: string;
  fotoUri: string | null;
  onSeleccionar: () => void;
  onQuitar: () => void;
}

/** Previsualización de la foto seleccionada o zona para elegir una nueva. */
export function ImagePickerSection({
  label,
  placeholderTitle,
  placeholderHint,
  fotoUri,
  onSeleccionar,
  onQuitar,
}: ImagePickerSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.group}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {fotoUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: fotoUri }} style={styles.preview} accessibilityLabel={label} />
          <Pressable
            onPress={onQuitar}
            style={styles.removeBtn}
            accessibilityRole="button"
            accessibilityLabel="Quitar foto"
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            <ThemedText style={styles.removeText}>Quitar</ThemedText>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onSeleccionar}
          accessibilityRole="button"
          style={[styles.placeholder, { borderColor: colors.tint, backgroundColor: colors.tint + "08" }]}
        >
          <Ionicons name="camera-outline" size={28} color={colors.tint} />
          <ThemedText type="smallBold" themeColor="tint">
            {placeholderTitle}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {placeholderHint}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.one },
  previewWrap: { position: "relative", borderRadius: 16, overflow: "hidden" },
  preview: { width: "100%", height: 200, borderRadius: 16 },
  removeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#000000AA",
  },
  removeText: { color: "#FFFFFF", fontSize: 12 },
  placeholder: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
  },
  center: { textAlign: "center" },
});
