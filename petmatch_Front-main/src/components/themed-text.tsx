import { Platform, StyleSheet, Text, type TextProps } from "react-native";

import { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "defaultSemiBold"
    | "title"
    | "small"
    | "smallBold"
    | "subtitle"
    | "link"
    | "linkPrimary"
    | "code";
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = "default",
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? "text"] },
        type === "default" && styles.default,
        type === "defaultSemiBold" && styles.defaultSemiBold,
        type === "title" && styles.title,
        type === "small" && styles.small,
        type === "smallBold" && styles.smallBold,
        type === "subtitle" && styles.subtitle,
        type === "link" && styles.link,
        type === "linkPrimary" && styles.linkPrimary,
        type === "code" && styles.code,
        style,
      ]}
      {...rest}
      // En web, role="text" se vuelve <p>. Dentro de un Pressable (button) es HTML
      // inválido: el navegador reescribe el DOM y React 19 lanza el error #418.
      accessibilityRole={
        rest.accessibilityRole ??
        (type === "title" || type === "subtitle" ? "header" : undefined)
      }
    />
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 13, lineHeight: 18 },
  smallBold: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
  default: { fontSize: 16, lineHeight: 22 },
  defaultSemiBold: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "700" },
  subtitle: { fontSize: 20, lineHeight: 26, fontWeight: "700" },
  link: { lineHeight: 26, fontSize: 14 },
  linkPrimary: { lineHeight: 26, fontSize: 14, color: "#3c87f7" },
  code: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontWeight: Platform.select({ android: "700" }) ?? "500",
    fontSize: 12,
  },
});
