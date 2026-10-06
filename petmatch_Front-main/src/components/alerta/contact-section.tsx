import { Ionicons } from "@expo/vector-icons";

import { FormCard } from "@/components/forms/form-card";
import { FormField } from "@/components/forms/form-field";
import { LocationInputSection } from "@/components/forms/location-input-section";
import { useAppTheme } from "@/contexts/theme-context";
import type { AlertaFormValues, FormSectionProps } from "@/types/forms";

/** Sección 3: dónde se perdió y WhatsApp del dueño. */
export function ContactSection({ values, setField }: FormSectionProps<AlertaFormValues>) {
  const { colors } = useAppTheme();

  return (
    <FormCard icon="location-outline" title="3. Ubicación y contacto directo">
      <LocationInputSection
        label="Sector o comuna donde se perdió *"
        placeholder="Ej: Manso de Velasco, Melipilla / Plaza de Armas..."
        sector={values.sector}
        onSectorChange={(v) => setField("sector", v)}
      />

      <FormField
        label="WhatsApp de contacto *"
        placeholder="+56 9 1234 5678"
        keyboardType="phone-pad"
        value={values.whatsapp}
        onChangeText={(v) => setField("whatsapp", v)}
        leading={<Ionicons name="logo-whatsapp" size={20} color={colors.whatsapp} />}
        hint="Quien la aviste podrá enviarte un WhatsApp directo con un solo toque."
      />
    </FormCard>
  );
}
