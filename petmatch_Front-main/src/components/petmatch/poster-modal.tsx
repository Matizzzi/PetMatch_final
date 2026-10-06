import React, { useState } from "react";
import {
  Modal,
  View,
  ScrollView,
  Pressable,
  Platform,
  Share,
  Linking,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/contexts/theme-context";
import { AlertaPerdida } from "@/types/api";
import { resolveFotoUrl } from "@/services/api";
import { getPosterModalStyles } from "./poster-modal.styles";

interface PosterModalProps {
  alerta: AlertaPerdida | null;
  visible: boolean;
  onClose: () => void;
}

function formatearFecha(fechaIso?: string): string {
  if (!fechaIso) return "Recientemente";
  try {
    const d = new Date(fechaIso);
    return d.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Recientemente";
  }
}

export function PosterModal({ alerta, visible, onClose }: PosterModalProps) {
  const { colors } = useAppTheme();
  const styles = getPosterModalStyles(colors);
  const [copiado, setCopiado] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [mensajeAviso, setMensajeAviso] = useState<string | null>(null);

  if (!alerta) return null;

  const { mascota } = alerta;
  const fotoUri = resolveFotoUrl(mascota.fotoUrl);
  const fechaTexto = formatearFecha(alerta.fechaPerdida || alerta.createdAt);
  const sectorTexto = alerta.sector || "Melipilla";
  const contactoTexto = alerta.whatsapp || "Contacto en PetMatch";

  const mostrarAviso = (msg: string) => {
    setMensajeAviso(msg);
    setTimeout(() => setMensajeAviso(null), 4500);
  };

  // Generar texto para compartir en WhatsApp o redes
  const textoEmergencia = `[SE BUSCA - CASO URGENTE]\n\n` +
    `• Nombre: ${mascota.nombre.toUpperCase()}\n` +
    `• Sector: ${sectorTexto}\n` +
    `• Fecha: ${fechaTexto}\n` +
    `• Especie: ${mascota.especie.toUpperCase()}\n` +
    (mascota.descripcion ? `• Descripción: "${mascota.descripcion}"\n` : "") +
    (mascota.usaCollar ? `• Usa collar: ${mascota.descripcionCollar || "Sí"}\n` : "") +
    (alerta.urgente ? `• ATENCIÓN: ¡Requiere cuidados médicos urgentes!\n` : "") +
    `\nContacto directo: ${contactoTexto}\n\n` +
    `PetMatch — Red Comunitaria para el Rescate de Mascotas`;

  // Acción: Compartir en WhatsApp
  const compartirWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(textoEmergencia)}`;
    Linking.openURL(url);
  };

  // Acción: Compartir en Facebook
  const compartirFacebook = async () => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(textoEmergencia);
    }
    mostrarAviso("¡Abriendo Facebook! Texto de búsqueda copiado para pegar en tu post o grupo.");
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(
      `SE BUSCA: ${mascota.nombre.toUpperCase()} | Sector ${sectorTexto} | Contacto: ${contactoTexto} #PetMatch`
    )}`;
    Linking.openURL(fbUrl);
  };

  // Acción: Compartir en Instagram (Historias / Feed)
  const compartirInstagram = async () => {
    // 1. Descarga el afiche para tener la foto lista en la galería
    await descargarAfiche();

    // 2. Copia el texto con hashtags para Historias / Publicación
    const textoInsta = `${textoEmergencia}\n\n#MascotaPerdida #SeBusca #Melipilla #PetMatch #${mascota.nombre.replace(/\s+/g, "")} #RescateAnimal`;
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(textoInsta);
    }
    mostrarAviso("¡Afiche descargado y texto copiado! Ya puedes publicarlo en tus Historias de Instagram.");

    // 3. Intenta abrir Instagram
    try {
      const puedeAbrirApp = await Linking.canOpenURL("instagram://");
      if (puedeAbrirApp) {
        await Linking.openURL("instagram://camera");
      } else {
        await Linking.openURL("https://www.instagram.com/");
      }
    } catch {
      Linking.openURL("https://www.instagram.com/");
    }
  };

  // Acción: Compartidor Nativo del Teléfono (abre selector de todas las apps instaladas)
  const compartirNativo = async () => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `SE BUSCA: ${mascota.nombre.toUpperCase()}`,
          text: textoEmergencia,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        });
        return;
      } catch {}
    }
    Share.share({
      title: `SE BUSCA: ${mascota.nombre}`,
      message: textoEmergencia,
    });
  };

  // Acción: Copiar al portapapeles
  const copiarTexto = async () => {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(textoEmergencia);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } else {
      Share.share({
        title: `SE BUSCA: ${mascota.nombre}`,
        message: textoEmergencia,
      });
    }
  };

  // Acción: Descargar afiche en alta definición (.PNG) mediante HTML5 Canvas (Web)
  const descargarAfiche = async () => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      // En móvil usamos el selector nativo de compartir
      Share.share({
        title: `Afiche Se Busca: ${mascota.nombre}`,
        message: textoEmergencia,
      });
      return;
    }

    try {
      setDescargando(true);
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1100;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Fondo blanco del afiche
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 800, 1100);

      // Borde exterior rojo llamativo
      ctx.strokeStyle = "#DC2626";
      ctx.lineWidth = 16;
      ctx.strokeRect(8, 8, 784, 1084);

      // 2. Encabezado Rojo
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(16, 16, 768, 140);

      // Badge superior amarillo
      ctx.fillStyle = "#FEF08A";
      ctx.roundRect ? ctx.roundRect(280, 28, 240, 32, 16) : ctx.fillRect(280, 28, 240, 32);
      ctx.fill();

      ctx.fillStyle = "#991B1B";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ALERTA COMUNITARIA", 400, 50);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 46px sans-serif";
      ctx.fillText("¡SE BUSCA!", 400, 105);

      ctx.fillStyle = "#FECACA";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("AYÚDANOS A QUE VUELVA A CASA", 400, 138);

      // 3. Foto de la mascota o ícono
      const drawPhotoOrPlaceholder = () => {
        return new Promise<void>((resolve) => {
          if (fotoUri) {
            const img = new (window as any).Image();
            img.crossOrigin = "anonymous";
            img.src = fotoUri;
            img.onload = () => {
              try {
                // Dibujar foto centrada en caja de 720 x 420
                ctx.save();
                ctx.beginPath();
                ctx.rect(40, 180, 720, 430);
                ctx.clip();
                ctx.drawImage(img, 40, 180, 720, 430);
                ctx.restore();

                // Marco de la foto
                ctx.strokeStyle = "#EF4444";
                ctx.lineWidth = 4;
                ctx.strokeRect(40, 180, 720, 430);
              } catch {}
              resolve();
            };
            img.onerror = () => {
              drawPlaceholder();
              resolve();
            };
          } else {
            drawPlaceholder();
            resolve();
          }
        });
      };

      const drawPlaceholder = () => {
        ctx.fillStyle = "#F3F4F6";
        ctx.fillRect(40, 180, 720, 430);
        ctx.fillStyle = "#9CA3AF";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("FOTO NO DISPONIBLE", 400, 400);
      };

      await drawPhotoOrPlaceholder();

      // 4. Nombre de la mascota
      ctx.fillStyle = "#111827";
      ctx.font = "900 52px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(mascota.nombre.toUpperCase(), 400, 670);

      // 5. Badges de detalles
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText(
        `Especie: ${mascota.especie.toUpperCase()}  |  Sector: ${sectorTexto}`,
        400,
        715
      );
      ctx.fillText(`Perdido el: ${fechaTexto}`, 400, 745);

      // 6. Descripción
      if (mascota.descripcion) {
        ctx.fillStyle = "#4B5563";
        ctx.font = "italic 20px sans-serif";
        const maxDesc = mascota.descripcion.length > 75 
          ? mascota.descripcion.substring(0, 75) + "..." 
          : mascota.descripcion;
        ctx.fillText(`"${maxDesc}"`, 400, 790);
      }

      // Urgente banner
      if (alerta.urgente) {
        ctx.fillStyle = "#DC2626";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("REQUIERE CUIDADOS MÉDICOS URGENTES", 400, 830);
      }

      // 7. Caja de Contacto Verde
      ctx.fillStyle = "#25D366";
      ctx.fillRect(40, 860, 720, 130);

      ctx.fillStyle = "#064E3B";
      ctx.font = "900 18px sans-serif";
      ctx.fillText("SI TIENES INFORMACIÓN O LO VISTE, COMUNÍCATE AL:", 400, 900);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 44px sans-serif";
      ctx.fillText(contactoTexto, 400, 955);

      // 8. Footer
      ctx.fillStyle = "#1F2937";
      ctx.fillRect(16, 1020, 768, 64);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("PetMatch — Red Comunitaria para el Rescate de Mascotas", 400, 1058);

      // Descargar como archivo .png
      const link = document.createElement("a");
      link.download = `afiche-se-busca-${mascota.nombre.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Error al generar afiche:", e);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.scrollWrap}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContainer}>
              {/* Barra Superior */}
              <View style={styles.topActionsBar}>
                <View style={styles.topTitleRow}>
                  <Ionicons name="megaphone" size={18} color="#DC2626" />
                  <ThemedText style={styles.topTitle}>
                    Afiche Digital "Se Busca"
                  </ThemedText>
                </View>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Vista Previa del Afiche */}
              <View style={styles.posterPaper}>
                {/* Cabecera */}
                <View style={styles.posterHeader}>
                  <View style={styles.headerBadge}>
                    <ThemedText style={styles.headerBadgeText}>
                      Alerta Comunitaria
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.posterMainHeading}>
                    ¡SE BUSCA!
                  </ThemedText>
                  <ThemedText style={styles.posterSubheading}>
                    Ayúdanos a que vuelva a casa
                  </ThemedText>
                </View>

                {/* Foto */}
                <View style={styles.photoSection}>
                  {fotoUri ? (
                    <Image
                      source={{ uri: fotoUri }}
                      style={styles.petPhoto}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="paw" size={60} color="#D1D5DB" />
                      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>
                        Sin fotografía disponible
                      </ThemedText>
                    </View>
                  )}

                  {alerta.urgente && (
                    <View style={styles.urgentRibbon}>
                      <Ionicons name="alert-circle" size={13} color="#FFFFFF" />
                      <ThemedText style={styles.urgentRibbonText}>
                        URGENTE
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Datos de la Mascota */}
                <View style={styles.posterBody}>
                  <ThemedText style={styles.petName}>
                    {mascota.nombre.toUpperCase()}
                  </ThemedText>

                  <View style={styles.detailsGrid}>
                    <View style={styles.badgeItem}>
                      <Ionicons name="paw-outline" size={12} color="#374151" />
                      <ThemedText style={styles.badgeText}>
                        {mascota.especie.toUpperCase()}
                      </ThemedText>
                    </View>

                    <View style={styles.badgeItem}>
                      <Ionicons name="location-outline" size={12} color="#374151" />
                      <ThemedText style={styles.badgeText}>
                        {sectorTexto}
                      </ThemedText>
                    </View>

                    <View style={styles.badgeItem}>
                      <Ionicons name="calendar-outline" size={12} color="#374151" />
                      <ThemedText style={styles.badgeText}>
                        {fechaTexto}
                      </ThemedText>
                    </View>

                    {mascota.usaCollar && (
                      <View style={[styles.badgeItem, styles.badgeSpecial]}>
                        <Ionicons name="pricetag-outline" size={12} color="#92400E" />
                        <ThemedText style={[styles.badgeText, styles.badgeSpecialText]}>
                          Usa Collar
                        </ThemedText>
                      </View>
                    )}

                    {mascota.tieneChip && (
                      <View style={[styles.badgeItem, styles.badgeSpecial]}>
                        <Ionicons name="hardware-chip-outline" size={12} color="#92400E" />
                        <ThemedText style={[styles.badgeText, styles.badgeSpecialText]}>
                          Tiene Chip
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {mascota.descripcion ? (
                    <View style={styles.descCard}>
                      <ThemedText style={styles.descText} numberOfLines={3}>
                        "{mascota.descripcion}"
                      </ThemedText>
                    </View>
                  ) : null}

                  {/* Caja de Contacto WhatsApp */}
                  <View style={styles.contactBox}>
                    <ThemedText style={styles.contactHelpText}>
                      Si lo viste o sabes algo, comunícate al:
                    </ThemedText>
                    <View style={styles.contactPhoneRow}>
                      <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
                      <ThemedText style={styles.contactPhone}>
                        {contactoTexto}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Footer del Afiche */}
                <View style={styles.posterFooter}>
                  <View style={styles.footerBrand}>
                    <Ionicons name="paw" size={14} color="#FFFFFF" />
                    <ThemedText style={styles.footerBrandText}>PetMatch</ThemedText>
                  </View>
                  <ThemedText style={styles.footerTagline}>
                    Comunidad de Rescate Animal
                  </ThemedText>
                </View>
              </View>

              {/* Botones de Acción y Redes Sociales */}
              <View style={styles.actionButtonsRow}>
                {/* 1. Botón Principal: Descargar Imagen */}
                <Pressable
                  onPress={descargarAfiche}
                  disabled={descargando}
                  style={({ pressed }) => [
                    styles.downloadBtn,
                    { opacity: pressed || descargando ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.downloadBtnText}>
                    {descargando ? "Generando imagen..." : "Descargar Afiche en Alta Calidad"}
                  </ThemedText>
                </Pressable>

                {/* Banner de Aviso Dinámico */}
                {mensajeAviso && (
                  <View style={styles.noticeBanner}>
                    <Ionicons name="information-circle" size={17} color="#065F46" />
                    <ThemedText style={styles.noticeText}>
                      {mensajeAviso}
                    </ThemedText>
                  </View>
                )}

                {/* 2. Sección: Difundir en Redes Sociales */}
                <View style={styles.socialSection}>
                  <View style={styles.socialHeader}>
                    <ThemedText style={styles.socialTitle}>
                      Difundir en Redes Sociales
                    </ThemedText>
                  </View>

                  {/* Fila de Redes Principales: WhatsApp, Instagram, Facebook */}
                  <View style={styles.socialGrid}>
                    {/* WhatsApp */}
                    <Pressable
                      onPress={compartirWhatsApp}
                      style={({ pressed }) => [
                        styles.socialBtn,
                        styles.btnWhatsApp,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" />
                      <ThemedText style={styles.socialBtnText}>
                        WhatsApp
                      </ThemedText>
                    </Pressable>

                    {/* Instagram */}
                    <Pressable
                      onPress={compartirInstagram}
                      style={({ pressed }) => [
                        styles.socialBtn,
                        styles.btnInstagram,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Ionicons name="logo-instagram" size={17} color="#FFFFFF" />
                      <ThemedText style={styles.socialBtnText}>
                        Instagram
                      </ThemedText>
                    </Pressable>

                    {/* Facebook */}
                    <Pressable
                      onPress={compartirFacebook}
                      style={({ pressed }) => [
                        styles.socialBtn,
                        styles.btnFacebook,
                        { opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      <Ionicons name="logo-facebook" size={17} color="#FFFFFF" />
                      <ThemedText style={styles.socialBtnText}>
                        Facebook
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Fila de Utilidades: Copiar Texto y Más Opciones */}
                  <View style={styles.utilityRow}>
                    <Pressable
                      onPress={copiarTexto}
                      style={({ pressed }) => [
                        styles.copyBtn,
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      <Ionicons
                        name={copiado ? "checkmark" : "copy-outline"}
                        size={15}
                        color={copiado ? "#10B981" : colors.text}
                      />
                      <ThemedText style={styles.copyBtnText}>
                        {copiado ? "¡Texto Copiado!" : "Copiar Texto"}
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={compartirNativo}
                      style={({ pressed }) => [
                        styles.nativeShareBtn,
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      <Ionicons name="share-social-outline" size={15} color={colors.text} />
                      <ThemedText style={styles.nativeShareText}>
                        Más Opciones
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
