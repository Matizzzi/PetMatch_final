import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { buildPosterData, type PosterExportAction } from "@/lib/poster";
import { downloadPoster, preparePosterExport, sharePosterToWhatsApp } from "@/lib/poster-export";
import type { AlertaPerdida } from "@/types/api";
import { getPosterModalStyles } from "./poster-modal.styles";
import { StoryPoster } from "./story-poster";

interface PosterModalProps {
  alerta: AlertaPerdida | null;
  visible: boolean;
  onClose: () => void;
}

type Accion = "descargar" | "whatsapp";

interface Aviso {
  tipo: "ok" | "error";
  texto: string;
}

const PREVIEW_MAX_WIDTH = 360;

export function PosterModal({ alerta, visible, onClose }: PosterModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {alerta && <PosterModalContent key={alerta.id} alerta={alerta} onClose={onClose} />}
    </Modal>
  );
}

function PosterModalContent({ alerta, onClose }: { alerta: AlertaPerdida; onClose: () => void }) {
  const { colors } = useAppTheme();
  const styles = getPosterModalStyles(colors);
  const { width: windowWidth } = useWindowDimensions();
  const posterRef = useRef<View>(null);

  const data = useMemo(() => buildPosterData(alerta), [alerta]);
  const [fotoLista, setFotoLista] = useState(false);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // Ancho del modal (máx. 440) menos márgenes; 360 pt ≈ 1080 px reales en pantallas 3x.
  const previewWidth = Math.min(Math.min(windowWidth - 32, 440) - 32, PREVIEW_MAX_WIDTH);
  // En móvil la captura es de la vista: hay que esperar a que la foto esté pintada.
  const listo = Platform.OS === "web" || fotoLista;

  useEffect(() => {
    preparePosterExport(data);
  }, [data]);

  // Timeout de seguridad: si la imagen de la mascota tarda o viene de caché,
  // habilitamos la interfaz tras 1.2 segundos para que el usuario nunca quede trabado.
  useEffect(() => {
    const timer = setTimeout(() => setFotoLista(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(timer);
  }, [aviso]);

  const marcarFotoLista = useCallback(() => setFotoLista(true), []);

  const ejecutar = async (tipo: Accion, action: PosterExportAction) => {
    setAccion(tipo);
    setAviso(null);
    try {
      const resultado = await action({ data, viewRef: posterRef });
      if (resultado.status === "ok") setAviso({ tipo: "ok", texto: resultado.message });
    } catch (error) {
      setAviso({
        tipo: "error",
        texto: error instanceof Error ? error.message : "No se pudo generar el afiche.",
      });
    } finally {
      setAccion(null);
    }
  };

  const deshabilitado = !listo || accion !== null;

  return (
    <View style={styles.overlay}>
      <View style={styles.scrollWrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.modalContainer}>
            <View style={styles.topActionsBar}>
              <View style={styles.topTitleRow}>
                <Ionicons name="megaphone" size={18} color="#DC2626" />
                <View>
                  <ThemedText style={styles.topTitle}>Afiche para Historias y Estados</ThemedText>
                  <ThemedText style={styles.topSubtitle}>Formato vertical 9:16 · 1080×1920 px</ThemedText>
                </View>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Cerrar">
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.previewWrap}>
              <View style={styles.previewFrame}>
                <StoryPoster
                  ref={posterRef}
                  data={data}
                  width={previewWidth}
                  onPhotoSettled={marcarFotoLista}
                />
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => ejecutar("descargar", downloadPoster)}
                disabled={deshabilitado}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.downloadBtn,
                  { opacity: deshabilitado ? 0.6 : pressed ? 0.85 : 1 },
                ]}
              >
                {accion === "descargar" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                )}
                <ThemedText style={styles.actionBtnText}>
                  {accion === "descargar" ? "Generando imagen..." : "Descargar Imagen"}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => ejecutar("whatsapp", sharePosterToWhatsApp)}
                disabled={deshabilitado}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.whatsappBtn,
                  { opacity: deshabilitado ? 0.6 : pressed ? 0.85 : 1 },
                ]}
              >
                {accion === "whatsapp" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                )}
                <ThemedText style={styles.actionBtnText}>Compartir en WhatsApp</ThemedText>
              </Pressable>

              {!listo && (
                <ThemedText style={styles.hintText}>Cargando la foto de {alerta.mascota.nombre}...</ThemedText>
              )}

              {aviso && (
                <View style={[styles.noticeBanner, aviso.tipo === "error" && styles.noticeError]}>
                  <Ionicons
                    name={aviso.tipo === "error" ? "alert-circle" : "checkmark-circle"}
                    size={17}
                    color={aviso.tipo === "error" ? "#991B1B" : "#065F46"}
                  />
                  <ThemedText style={[styles.noticeText, aviso.tipo === "error" && styles.noticeErrorText]}>
                    {aviso.texto}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
