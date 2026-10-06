import { ImagePickerSection } from "@/components/forms/image-picker-section";
import type { PhotoAnalysisState } from "@/hooks/use-photo-analysis";
import { AiAnalysisSummary } from "./ai-analysis-summary";
import { AiAnalyzeButton } from "./ai-analyze-button";
import { AiTriageBadge } from "./ai-triage-badge";

interface AiPhotoPanelProps {
  state: PhotoAnalysisState;
  label: string;
  placeholderTitle: string;
  placeholderHint: string;
}

/**
 * Bloque foto → botón IA → resumen → triaje.
 * Compartido por las pantallas de alerta y avistamiento.
 */
export function AiPhotoPanel({ state, label, placeholderTitle, placeholderHint }: AiPhotoPanelProps) {
  const { foto, analizando, resultado, analizar } = state;

  return (
    <>
      <ImagePickerSection
        label={label}
        placeholderTitle={placeholderTitle}
        placeholderHint={placeholderHint}
        fotoUri={foto.fotoUri}
        onSeleccionar={foto.seleccionarFoto}
        onQuitar={foto.quitarFoto}
      />
      {foto.fotoUri && <AiAnalyzeButton analizando={analizando} onPress={analizar} />}
      {resultado && <AiAnalysisSummary analisis={resultado} />}
      {resultado?.nivelUrgencia && <AiTriageBadge triaje={resultado} />}
    </>
  );
}
