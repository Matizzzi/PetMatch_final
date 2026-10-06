import { AiPhotoPanel } from "@/components/ai/ai-photo-panel";
import { FormCard } from "@/components/forms/form-card";
import { FormField } from "@/components/forms/form-field";
import { SpeciesSelector } from "@/components/forms/species-selector";
import type { PhotoAnalysisState } from "@/hooks/use-photo-analysis";
import type { AlertaFormValues, FormSectionProps } from "@/types/forms";

interface PetDataSectionProps extends FormSectionProps<AlertaFormValues> {
  fotoIA: PhotoAnalysisState;
}

/** Sección 1: identidad de la mascota, foto con análisis IA y descripción. */
export function PetDataSection({ values, setField, fotoIA }: PetDataSectionProps) {
  return (
    <FormCard icon="paw-outline" title="1. Datos de tu mascota">
      <FormField
        label="Nombre de la mascota *"
        placeholder="Ej: Bobby, Misi, Luna..."
        value={values.nombreMascota}
        onChangeText={(v) => setField("nombreMascota", v)}
      />

      <SpeciesSelector
        label="Especie *"
        value={values.especie}
        onChange={(v) => setField("especie", v)}
      />

      <AiPhotoPanel
        state={fotoIA}
        label="Foto de la mascota (muy recomendado)"
        placeholderTitle="Subir o tomar una foto"
        placeholderHint="Ayudará mucho a que la comunidad la reconozca"
      />

      <FormField
        label="Descripción y señas particulares *"
        placeholder="Color del pelaje, tamaño aproximado, manchas, si responde a su nombre..."
        value={values.descripcion}
        onChangeText={(v) => setField("descripcion", v)}
        multiline
        numberOfLines={3}
      />
    </FormCard>
  );
}
