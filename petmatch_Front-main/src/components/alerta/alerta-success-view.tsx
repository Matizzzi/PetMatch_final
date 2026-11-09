import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ActionButton } from "@/components/forms/feedback";
import { SuccessView } from "@/components/forms/success-view";
import { PosterModal } from "@/components/petmatch/poster-modal";
import { ThemedText } from "@/components/themed-text";
import { SemanticColors } from "@/constants/petmatch";
import { useAppTheme } from "@/contexts/theme-context";
import { formatearCodigoCierre } from "@/lib/codigos-cierre";
import { webSafeButtonRole } from "@/lib/web-a11y";
import type { AlertaPerdida } from "@/types/api";

interface AlertaSuccessViewProps {
  alerta: AlertaPerdida;
  codigoCierre?: string | null;
  onVerMapa: () => void;
  onCrearOtra: () => void;
}

/** Confirmación de alerta publicada con código de cierre y afiche "SE BUSCA". */
export function AlertaSuccessView({
  alerta,
  codigoCierre,
  onVerMapa,
  onCrearOtra,
}: AlertaSuccessViewProps) {
  const { colors } = useAppTheme();
  const [mostrarAfiche, setMostrarAfiche] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const copiarCodigo = async () => {
    if (!codigoCierre) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formatearCodigoCierre(codigoCierre));
        setCopiado(true);
      }
    } catch {
      setCopiado(false);
    }
  };

  return (
    <SuccessView
      icon="checkmark-circle"
      title="¡Alerta Publicada!"
      message={`La alerta de ${alerta.mascota.nombre} ya está activa. Quienes la vean podrán escribirte por WhatsApp.`}
    >
      {codigoCierre ? (
        <View style={[styles.codeCard, { borderColor: colors.border, backgroundColor: colors.backgroundSelected }]}>
          <ThemedText type="smallBold" style={styles.codeLabel}>
            Guarda este código para marcarla como reencontrada
          </ThemedText>
          <ThemedText type="code" style={[styles.codeValue, { color: colors.text }]}>
            {formatearCodigoCierre(codigoCierre)}
          </ThemedText>
          <Pressable onPress={() => void copiarCodigo()} accessibilityRole={webSafeButtonRole}>
            <ThemedText type="smallBold" style={{ color: colors.tint, textAlign: "center" }}>
              {copiado ? "Copiado" : "Copiar código"}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      <ActionButton
        icon="megaphone"
        label='Generar Afiche "SE BUSCA"'
        color={SemanticColors.danger}
        onPress={() => setMostrarAfiche(true)}
      />
      <ActionButton icon="map-outline" label="Ver en el mapa de alertas" onPress={onVerMapa} />
      <ActionButton variant="secondary" label="Crear otra alerta" onPress={onCrearOtra} />

      <PosterModal alerta={alerta} visible={mostrarAfiche} onClose={() => setMostrarAfiche(false)} />
    </SuccessView>
  );
}

const styles = StyleSheet.create({
  codeCard: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginBottom: 4,
  },
  codeLabel: { textAlign: "center" },
  codeValue: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 3,
    textAlign: "center",
    fontWeight: "800",
  },
});
