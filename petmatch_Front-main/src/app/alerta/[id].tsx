import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StoryPoster } from "@/components/petmatch/story-poster";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAppTheme } from "@/contexts/theme-context";
import { buildPosterData } from "@/lib/poster";
import { obtenerAlerta } from "@/services/alertas";
import { ApiRequestError } from "@/services/api";
import type { AlertaPerdida } from "@/types/api";

export default function AlertaPublicaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const [alerta, setAlerta] = useState<AlertaPerdida | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    obtenerAlerta(id)
      .then((data) => activo && setAlerta(data))
      .catch((err: unknown) => {
        if (!activo) return;
        setError(
          err instanceof ApiRequestError && err.status === 404
            ? "Esta alerta no existe o fue eliminada."
            : "No pudimos cargar la alerta. Revisa tu conexión.",
        );
      });
    return () => {
      activo = false;
    };
  }, [id]);

  const data = useMemo(() => (alerta ? buildPosterData(alerta) : null), [alerta]);
  const posterWidth = Math.min(width - 32, 400);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          {!data && !error && <ActivityIndicator size="large" color={colors.tint} />}

          {error && (
            <ThemedText type="subtitle" style={styles.center}>
              {error}
            </ThemedText>
          )}

          {data && alerta && (
            <>
              {!alerta.activa && (
                <View style={styles.resolvedBanner}>
                  <Ionicons name="heart" size={16} color="#065F46" />
                  <ThemedText style={styles.resolvedText}>
                    ¡{alerta.mascota.nombre} ya volvió a casa! Gracias por ayudar.
                  </ThemedText>
                </View>
              )}

              <View style={styles.posterFrame}>
                <StoryPoster data={data} width={posterWidth} />
              </View>

              {data.whatsappDigits && alerta.activa && (
                <Pressable
                  onPress={() =>
                    Linking.openURL(
                      `https://wa.me/${data.whatsappDigits}?text=${encodeURIComponent(
                        `Hola, vi la alerta de ${alerta.mascota.nombre} en PetMatch y tengo información.`,
                      )}`,
                    )
                  }
                  style={({ pressed }) => [styles.whatsappBtn, { width: posterWidth, opacity: pressed ? 0.85 : 1 }]}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.whatsappText}>Tengo información</ThemedText>
                </Pressable>
              )}
            </>
          )}

          <Link href="/" style={[styles.homeLink, { color: colors.tint }]}>
            Ver todas las alertas en PetMatch
          </Link>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 16,
  },
  center: { textAlign: "center" },
  posterFrame: {
    borderRadius: 16,
    overflow: "hidden",
  },
  resolvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resolvedText: { color: "#065F46", fontWeight: "700", fontSize: 14 },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#25D366",
  },
  whatsappText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  homeLink: { fontSize: 14, fontWeight: "600", paddingVertical: 8 },
});
