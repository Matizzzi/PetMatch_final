import { router } from "expo-router";

import { AlertaSuccessView } from "@/components/alerta/alerta-success-view";
import { ContactSection } from "@/components/alerta/contact-section";
import { HealthSection } from "@/components/alerta/health-section";
import { PetDataSection } from "@/components/alerta/pet-data-section";
import { EmergencyToggle } from "@/components/forms/emergency-toggle";
import { ActionButton, ErrorBanner } from "@/components/forms/feedback";
import { FormScreenLayout } from "@/components/forms/form-screen-layout";
import { ScreenHeader } from "@/components/forms/screen-header";
import { useAppTheme } from "@/contexts/theme-context";
import { useAlertForm } from "@/hooks/use-alert-form";

/**
 * Pantalla "Se me perdió" (container): delega estado y reglas a `useAlertForm`
 * y compone secciones presentacionales.
 */
export default function PerdidaScreen() {
  const { colors } = useAppTheme();
  const form = useAlertForm();
  const { values, setField } = form;

  if (form.alertaCreada) {
    return (
      <AlertaSuccessView
        alerta={form.alertaCreada}
        onCrearOtra={form.reiniciar}
        onVerMapa={() => {
          form.reiniciar();
          router.push("/(tabs)");
        }}
      />
    );
  }

  return (
    <FormScreenLayout>
      <ScreenHeader
        icon="megaphone"
        color={colors.urgent}
        title="Se me perdió"
        subtitle={
          form.usuario
            ? `Publicando como ${form.usuario.nombre}`
            : "Alerta comunitaria inmediata (sin registro obligatorio)"
        }
      />

      <EmergencyToggle
        title="Marcar como caso urgente"
        hint="Recomendado si necesita medicación urgente, es muy cachorro o anciano."
        value={values.urgente}
        onValueChange={(v) => setField("urgente", v)}
      />

      <PetDataSection values={values} setField={setField} fotoIA={form.fotoIA} />
      <HealthSection values={values} setField={setField} />
      <ContactSection values={values} setField={setField} />

      {form.errorMsg && <ErrorBanner message={form.errorMsg} />}

      <ActionButton
        icon="paper-plane-outline"
        label="Publicar Alerta de Pérdida"
        loadingLabel="Publicando alerta..."
        loading={form.publicando}
        onPress={form.publicar}
      />
    </FormScreenLayout>
  );
}
