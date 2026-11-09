import { type ReactNode, useEffect, useState } from "react";
import { Platform, View } from "react-native";

/**
 * En web el HTML estático de RN no coincide con lo que hidrata React (error #418).
 * Servidor y primer paint del cliente renderizan el mismo placeholder; la UI
 * real monta después, solo en el browser.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(Platform.OS !== "web");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <View style={{ flex: 1, backgroundColor: "#F8FAFC" }} />;
  }

  return children;
}
