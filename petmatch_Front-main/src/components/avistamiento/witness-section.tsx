import { FormCard } from "@/components/forms/form-card";
import { FormField } from "@/components/forms/form-field";
import { LocationInputSection } from "@/components/forms/location-input-section";
import { ThemedText } from "@/components/themed-text";
import type { AvistamientoFormValues, FormSectionProps } from "@/types/forms";

/** Sección 2: dónde se vio al animal y datos opcionales del testigo. */
export function WitnessSection({ values, setField }: FormSectionProps<AvistamientoFormValues>) {
  return (
    <FormCard icon="location-outline" title="2. Lugar y contacto">
      <LocationInputSection
        label="¿Dónde lo viste? (Sector / Comuna)"
        placeholder="Ej: Plaza de Armas, cerca de supermercado..."
        sector={values.comuna}
        onSectorChange={(v) => setField("comuna", v)}
      />

      <ThemedText type="small" themeColor="textSecondary">
        Tus datos son opcionales: sirven para que el dueño pueda llamarte o escribirte si cree que
        es su mascota.
      </ThemedText>

      <FormField
        label="Tu nombre"
        placeholder="Tu nombre (opcional)"
        value={values.contactoNombre}
        onChangeText={(v) => setField("contactoNombre", v)}
      />

      <FormField
        label="Teléfono o WhatsApp"
        placeholder="+569..."
        keyboardType="phone-pad"
        value={values.contactoTelefono}
        onChangeText={(v) => setField("contactoTelefono", v)}
      />
    </FormCard>
  );
}
