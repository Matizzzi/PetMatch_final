import { useState } from "react";

import { ActionButton } from "@/components/forms/feedback";
import { SuccessView } from "@/components/forms/success-view";
import { PosterModal } from "@/components/petmatch/poster-modal";
import { ThemedText } from "@/components/themed-text";
import { SemanticColors } from "@/constants/petmatch";
import type { AlertaPerdida } from "@/types/api";

interface AlertaSuccessViewProps {
  alerta: AlertaPerdida;
  onVerMapa: () => void;
  onCrearOtra: () => void;
}

/** Confirmación de alerta publicada con acceso al afiche "SE BUSCA". */
export function AlertaSuccessView({ alerta, onVerMapa, onCrearOtra }: AlertaSuccessViewProps) {
  const [mostrarAfiche, setMostrarAfiche] = useState(false);

  return (
    <SuccessView
      icon="checkmark-circle"
      title="¡Alerta Publicada!"
      message={
        <>
          La alerta de <ThemedText type="defaultSemiBold">{alerta.mascota.nombre}</ThemedText> ya
          está activa en el mapa de PetMatch. Quienes la vean podrán comunicarse directamente a tu
          WhatsApp.
        </>
      }
    >
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
