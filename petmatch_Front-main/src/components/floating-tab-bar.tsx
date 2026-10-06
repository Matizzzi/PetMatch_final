import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useAppTheme } from "@/contexts/theme-context";

const ICONS_ACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "map",
  perdida: "paw",
  reportar: "camera",
};

const ICONS_INACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "map-outline",
  perdida: "paw-outline",
  reportar: "camera-outline",
};

const LABELS: Record<string, string> = {
  index: "Mapa",
  perdida: "Perdida",
  reportar: "Reportar",
};

export default function FloatingTabBar({ state, navigation }: any) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) + Spacing.two }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.backgroundElement + "F2",
            borderColor: colors.border,
            ...(Platform.OS === "web"
              ? ({
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                } as any)
              : {}),
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const icon =
            (focused ? ICONS_ACTIVE[route.name] : ICONS_INACTIVE[route.name]) ??
            "ellipse";
          const label = LABELS[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[
                styles.item,
                focused && [
                  styles.itemFocused,
                  { backgroundColor: colors.tint + "12" },
                ],
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  focused && {
                    backgroundColor: colors.tint,
                    ...(Platform.select({
                      ios: {
                        shadowColor: colors.tint,
                        shadowOpacity: 0.35,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                      },
                      android: { elevation: 4 },
                    }) as object),
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={19}
                  color={focused ? "#FFFFFF" : colors.textSecondary}
                />
              </View>
              <ThemedText
                numberOfLines={1}
                type="small"
                style={{
                  color: focused ? colors.tint : colors.textSecondary,
                  fontWeight: focused ? "700" : "500",
                  fontSize: 12,
                }}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "92%",
    maxWidth: 380,
    borderRadius: 32,
    borderWidth: 1.2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
      web: {
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
      } as any,
    }),
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 6,
    borderRadius: 22,
  },
  itemFocused: {
    transform: [{ scale: 1.02 }],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

