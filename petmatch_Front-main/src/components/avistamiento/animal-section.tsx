import { AiPhotoPanel } from "@/components/ai/ai-photo-panel";
import { EmergencyToggle } from "@/components/forms/emergency-toggle";
import { FormCard } from "@/components/forms/form-card";
import { FormField } from "@/components/forms/form-field";
import { SpeciesSelector } from "@/components/forms/species-selector";
import type { PhotoAnalysisState } from "@/hooks/use-photo-analysis";
import type { AvistamientoFormValues, FormSectionProps } from "@/types/forms";

interface AnimalSectionProps extends FormSectionProps<AvistamientoFormValues> {
  fotoIA: PhotoAnalysisState;
}

/** Sección 1: foto + triaje IA, especie, urgencia, condición y descripción del animal. */
export function AnimalSection({ values, setField, fotoIA }: AnimalSectionProps) {
  return (
    <FormCard icon="eye-outline" title="1. El animal que viste">
      <AiPhotoPanel
        state={fotoIA}
        label="Foto del animal avistado"
        placeholderTitle="Subir foto del animal"
        placeholderHint="Toma o sube una foto clara para que el dueño lo reconozca"
      />

      <SpeciesSelector
        label="¿Qué animal viste?"
        value={values.especie}
        onChange={(v) => setField("especie", v)}
      />

      <EmergencyToggle
        title="Animal en estado urgente"
        hint="Heridas, desnutrición, cojera o necesita atención veterinaria."
        value={values.urgente}
        onValueChange={(v) => setField("urgente", v)}
      />

      <FormField
        label="Condición médica observada (Opcional)"
        placeholder="Ej: Herida en pata izquierda, muy delgado, sarna..."
        value={values.condicionMedica}
        onChangeText={(v) => setField("condicionMedica", v)}
      />

      <FormField
        label="Descripción del animal"
        placeholder="Describe color, tamaño, si tiene collar, manchas o comportamiento..."
        value={values.descripcion}
        onChangeText={(v) => setField("descripcion", v)}
        multiline
        numberOfLines={3}
      />
    </FormCard>
  );
}
