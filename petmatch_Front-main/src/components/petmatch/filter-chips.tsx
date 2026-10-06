import { ScrollView, StyleSheet, Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";

export type FilterType = "todos" | "urgente" | "perro" | "gato" | "avistamientos";

interface FilterOption {
  id: FilterType;
  label: string;
}

const OPTIONS: FilterOption[] = [
  { id: "todos", label: "Perdidas" },
  { id: "urgente", label: "Urgentes" },
  { id: "perro", label: "Perros" },
  { id: "gato", label: "Gatos" },
  { id: "avistamientos", label: "Avistamientos" },
];

interface FilterChipsProps {
  selected: FilterType;
  onSelect: (type: FilterType) => void;
  counts: Record<FilterType, number>;
}

export function FilterChips({ selected, onSelect, counts }: FilterChipsProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {OPTIONS.map((opt) => {
        const isSelected = selected === opt.id;
        const count = counts[opt.id] ?? 0;

        return (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected
                  ? colors.tint
                  : colors.backgroundElement,
                borderColor: isSelected ? colors.tint : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[
                styles.label,
                { color: isSelected ? "#FFFFFF" : colors.text },
              ]}
            >
              {opt.label}
            </ThemedText>
            <View
              style={[
                styles.countBadge,
                {
                  backgroundColor: isSelected
                    ? "rgba(255,255,255,0.25)"
                    : colors.cardMuted,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={[
                  styles.countText,
                  { color: isSelected ? "#FFFFFF" : colors.textSecondary },
                ]}
              >
                {count}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
