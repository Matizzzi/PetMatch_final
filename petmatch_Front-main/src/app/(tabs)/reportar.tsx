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
        title="¡Avistamiento Reportado!"
        message="Muchas gracias por colaborar. El motor de PetMatch acaba de comparar este avistamiento con las alertas activas de mascotas perdidas cercanas."
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
        title="Reportar Avistamiento"
        subtitle="¿Viste a un perrito o gatito solo en la calle? Repórtalo para cruzar datos y avisar a su dueño."
      />

      <AnimalSection values={values} setField={setField} fotoIA={form.fotoIA} />
      <WitnessSection values={values} setField={setField} />

      {form.errorMsg && <ErrorBanner message={form.errorMsg} />}

      <ActionButton
        icon="send"
        label="Publicar Avistamiento y Buscar Match"
        loading={form.enviando}
        onPress={form.enviar}
      />
    </FormScreenLayout>
  );
}
