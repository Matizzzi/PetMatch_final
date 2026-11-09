import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { formatearCodigoCierre, normalizarCodigoCierre } from "@/lib/codigos-cierre";
import { webSafeButtonRole } from "@/lib/web-a11y";

interface CodigoCierreModalProps {
  visible: boolean;
  nombreMascota: string;
  enviando?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (codigo: string) => void;
}

/** Pide el código que se entrega al publicar, sin exigir cuenta. */
export function CodigoCierreModal({
  visible,
  nombreMascota,
  enviando = false,
  error,
  onCancel,
  onConfirm,
}: CodigoCierreModalProps) {
  const { colors } = useAppTheme();
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    if (visible) setCodigo("");
  }, [visible]);

  const limpio = normalizarCodigoCierre(codigo);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <ThemedText type="subtitle" style={[styles.title, { color: colors.text }]}>
            {`¿Ya volvió ${nombreMascota}?`}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.hint}>
            Ingresa el código que te dimos al publicar. No hace falta crear una cuenta.
          </ThemedText>
          <TextInput
            value={formatearCodigoCierre(codigo)}
            onChangeText={setCodigo}
            placeholder="XXXX-XXXX"
            placeholderTextColor={colors.textSecondary + "90"}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!enviando}
            accessibilityLabel="Código de cierre"
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: error ? colors.urgent : colors.border,
                backgroundColor: colors.backgroundSelected,
              },
            ]}
          />
          {error ? (
            <ThemedText type="small" style={{ color: colors.urgent }}>
              {error}
            </ThemedText>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={enviando}
              accessibilityRole={webSafeButtonRole}
              style={({ pressed }) => [styles.btnGhost, { opacity: pressed ? 0.7 : 1 }]}
            >
              <ThemedText type="smallBold">Cancelar</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(limpio)}
              disabled={enviando || limpio.length < 6}
              accessibilityRole={webSafeButtonRole}
              style={({ pressed }) => [
                styles.btnOk,
                { opacity: enviando || limpio.length < 6 ? 0.5 : pressed ? 0.85 : 1 },
              ]}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <ThemedText type="smallBold" style={styles.btnOkText}>
                  Ya volvió
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: { fontSize: 20 },
  hint: { fontSize: 14, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    letterSpacing: 3,
    fontWeight: "800",
    textAlign: "center",
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  btnGhost: { paddingVertical: 12, paddingHorizontal: 14 },
  btnOk: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 120,
    alignItems: "center",
  },
  btnOkText: { color: "#FFFFFF" },
});
