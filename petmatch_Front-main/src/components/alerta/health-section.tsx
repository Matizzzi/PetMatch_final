import { FormCard } from "@/components/forms/form-card";
import { FormField } from "@/components/forms/form-field";
import { SwitchRow } from "@/components/forms/switch-row";
import type { AlertaFormValues, FormSectionProps } from "@/types/forms";

/** Sección 2: collar, microchip y condición médica. */
export function HealthSection({ values, setField }: FormSectionProps<AlertaFormValues>) {
  return (
    <FormCard icon="pricetag-outline" title="2. Identificación y salud">
      <SwitchRow
        label="¿Lleva collar puesto?"
        hint="Indica si tiene placa o cascabel"
        value={values.usaCollar}
        onValueChange={(v) => setField("usaCollar", v)}
      />

      {values.usaCollar && (
        <FormField
          label="Detalles del collar"
          placeholder="Ej: Rojo con placa metálica, cascabel azul..."
          value={values.descripcionCollar}
          onChangeText={(v) => setField("descripcionCollar", v)}
        />
      )}

      <SwitchRow
        label="¿Tiene microchip de identificación?"
        hint="Registrado en el Registro Nacional de Mascotas"
        value={values.tieneChip}
        onValueChange={(v) => setField("tieneChip", v)}
      />

      <FormField
        label="Condición médica / cuidados especiales"
        placeholder="Ej: Ciega de un ojo, requiere pastillas diarias (opcional)"
        value={values.condicionMedica}
        onChangeText={(v) => setField("condicionMedica", v)}
      />
    </FormCard>
  );
}
