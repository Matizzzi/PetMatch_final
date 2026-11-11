import { router } from "expo-router";

import { AnimalSection } from "@/components/avistamiento/animal-section";
import { WitnessSection } from "@/components/avistamiento/witness-section";
import { ActionButton, ErrorBanner } from "@/components/forms/feedback";
import { FormScreenLayout } from "@/components/forms/form-screen-layout";
import { ScreenHeader } from "@/components/forms/screen-header";
import { SuccessView } from "@/components/forms/success-view";
import { SemanticColors } from "@/constants/petmatch";
import { useSightingForm } from "@/hooks/use-sighting-form";

/**
 * Pantalla "Reportar avistamiento" (container): la lógica vive en `useSightingForm`.
 */
export default function ReportarScreen() {
  const form = useSightingForm();
  const { values, setField } = form;

  if (form.exito) {
    return (
      <SuccessView
        icon="sparkles"
        title="¡Gracias por reportar!"
        message="Ya cruzamos este avistamiento con las alertas activas cerca de Melipilla."
      >
        <ActionButton
          icon="map-outline"
          label="Volver al mapa"
          onPress={() => {
            form.reiniciar();
            router.push("/(tabs)");
          }}
        />
        <ActionButton variant="secondary" label="Reportar otro animal" onPress={form.reiniciar} />
      </SuccessView>
    );
  }

  return (
    <FormScreenLayout>
      <ScreenHeader
        icon="eye"
        color={SemanticColors.warning}
        title="Vi un animal"
        subtitle="Publicá lo que viste. Lo cruzamos con las mascotas que se buscan cerca."
      />

      <AnimalSection values={values} setField={setField} fotoIA={form.fotoIA} />
      <WitnessSection values={values} setField={setField} />

      {form.errorMsg && <ErrorBanner message={form.errorMsg} />}

      <ActionButton
        icon="send"
        label="Publicar avistamiento"
        loading={form.enviando}
        onPress={form.enviar}
      />
    </FormScreenLayout>
  );
}
