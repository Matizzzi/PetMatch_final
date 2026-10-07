import type { RefObject } from "react";
import { Platform, type View } from "react-native";
import * as Linking from "expo-linking";

import { resolveFotoUrl } from "@/services/api";
import type { AlertaPerdida } from "@/types/api";

/**
 * Diseño del afiche vertical 9:16 en píxeles de salida (1080×1920).
 * Lo comparten la vista React Native (capturada en móvil) y el renderer Canvas (web),
 * así ambos producen la misma imagen. El contenido clave queda entre y≈170 e y≈1720
 * para no quedar tapado por la interfaz de Instagram Stories / Estados de WhatsApp.
 */
export const POSTER_LAYOUT = {
  width: 1080,
  height: 1920,
  marginX: 64,
  contentWidth: 952,
  header: {
    height: 540,
    pills: { centerY: 200, height: 60, gap: 16, paddingX: 28, fontSize: 26 },
    title: { centerY: 320, fontSize: 150 },
    name: { centerY: 455, fontSize: 84, minFontSize: 52 },
  },
  photo: { top: 580, height: 560, radius: 40, border: 6 },
  info: {
    columnGap: 40,
    labelFontSize: 24,
    valueFontSize: 42,
    labelToValue: 42,
    rows: [1180, 1280],
    senas: { labelCenterY: 1380, firstLineCenterY: 1424, lineHeight: 44, fontSize: 34, maxLines: 2 },
  },
  footer: {
    top: 1520,
    height: 200,
    gap: 24,
    radius: 32,
    contact: {
      paddingX: 32,
      labelOffsetY: 56,
      labelFontSize: 26,
      phoneOffsetY: 132,
      phoneFontSize: 60,
      minPhoneFontSize: 40,
    },
    qr: { size: 200, border: 4, padding: 16, radius: 24 },
  },
  band: { top: 1748, brandCenterY: 1800, brandFontSize: 30, subCenterY: 1845, subFontSize: 24 },
} as const;

export const POSTER_COLORS = {
  red: "#DC2626",
  redDark: "#991B1B",
  redSoft: "#FEE2E2",
  yellow: "#FEF08A",
  ink: "#111827",
  muted: "#6B7280",
  soft: "#F3F4F6",
  line: "#E5E7EB",
  paper: "#FFFFFF",
  green: "#25D366",
  greenDark: "#064E3B",
  bandSub: "#9CA3AF",
} as const;

export const POSTER_TEXT = {
  badge: "ALERTA COMUNITARIA",
  urgent: "URGENTE",
  title: "SE BUSCA",
  brand: "PetMatch · Red comunitaria de rescate animal",
  bandSub: "Melipilla, Chile · Escanea el QR para ver la alerta",
  photoPlaceholder: "FOTO NO DISPONIBLE",
} as const;

export function posterColumns() {
  const { marginX, contentWidth, info } = POSTER_LAYOUT;
  const width = (contentWidth - info.columnGap) / 2;
  return { width, leftX: marginX, rightX: marginX + width + info.columnGap };
}

export function posterFooterBoxes() {
  const { marginX, contentWidth, footer } = POSTER_LAYOUT;
  const contactWidth = contentWidth - footer.qr.size - footer.gap;
  return {
    contact: { x: marginX, y: footer.top, width: contactWidth, height: footer.height },
    qr: { x: marginX + contactWidth + footer.gap, y: footer.top, size: footer.qr.size },
  };
}

export interface PosterInfoField {
  label: string;
  value: string;
}

export interface PosterData {
  alertaId: string;
  nombre: string;
  urgente: boolean;
  fotoUri: string | null;
  /** Filas de 2 columnas: [Especie, Sector], [Fecha, Identificación]. */
  infoRows: [[PosterInfoField, PosterInfoField], [PosterInfoField, PosterInfoField]];
  senas: string;
  contactLabel: string;
  contacto: string;
  /** Número en formato internacional sin "+" (para wa.me), o null si no hay WhatsApp. */
  whatsappDigits: string | null;
  publicUrl: string;
  shareTitle: string;
  shareText: string;
  fileName: string;
}

export interface PosterExportContext {
  data: PosterData;
  viewRef: RefObject<View | null>;
}

export interface PosterExportResult {
  status: "ok" | "cancelled";
  message: string;
}

export type PosterExportAction = (context: PosterExportContext) => Promise<PosterExportResult>;

const COMUNA = "Melipilla";

export function getAlertaPublicUrl(alertaId: string): string {
  const path = `/alerta/${encodeURIComponent(alertaId)}`;
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim().replace(/\/+$/, "");
  if (webUrl) return `${webUrl}${path}`;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return Linking.createURL(path);
}

/** Normaliza celulares chilenos a 569XXXXXXXX; deja otros formatos como dígitos. */
export function normalizarWhatsApp(raw?: string | null): string | null {
  const digits = raw?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  if (/^9\d{8}$/.test(digits)) return `56${digits}`;
  return digits;
}

function formatearTelefono(digits: string): string {
  if (/^569\d{8}$/.test(digits)) {
    return `+56 9 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

function formatearFechaLarga(fechaIso?: string): string {
  const fecha = fechaIso ? new Date(fechaIso) : null;
  if (!fecha || Number.isNaN(fecha.getTime())) return "Recientemente";
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

function capitalizar(texto: string): string {
  const limpio = texto.trim();
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase() : "No indicada";
}

function slug(texto: string): string {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "mascota"
  );
}

export function buildPosterData(alerta: AlertaPerdida): PosterData {
  const { mascota } = alerta;
  const nombre = mascota.nombre.trim().toUpperCase();
  const sector = alerta.sector?.trim();
  const sectorComuna = !sector
    ? COMUNA
    : sector.toLowerCase().includes(COMUNA.toLowerCase())
      ? sector
      : `${sector}, ${COMUNA}`;
  const fecha = formatearFechaLarga(alerta.fechaPerdida || alerta.createdAt);

  const identificacion =
    [
      mascota.usaCollar
        ? mascota.descripcionCollar?.trim()
          ? `Collar ${mascota.descripcionCollar.trim()}`
          : "Usa collar"
        : null,
      mascota.tieneChip ? "Chip" : null,
    ]
      .filter((v): v is string => Boolean(v))
      .join(" + ") || "Sin collar ni chip";

  const senas = mascota.descripcion?.trim() || "Sin descripción adicional.";
  const whatsappDigits = normalizarWhatsApp(alerta.whatsapp);
  const contacto = whatsappDigits ? formatearTelefono(whatsappDigits) : "Contacto en PetMatch";
  const publicUrl = getAlertaPublicUrl(alerta.id);
  const especie = capitalizar(mascota.especie);

  const shareText = [
    `[SE BUSCA${alerta.urgente ? " - URGENTE" : ""}] ${nombre}`,
    "",
    `• Especie: ${especie}`,
    `• Sector: ${sectorComuna}`,
    `• Perdido el: ${fecha}`,
    `• Señas: ${senas}`,
    `• Identificación: ${identificacion}`,
    alerta.urgente ? "• ATENCIÓN: requiere cuidados médicos urgentes." : null,
    "",
    `Contacto: ${contacto}`,
    `Ver la alerta: ${publicUrl}`,
    "",
    "#SeBusca #MascotaPerdida #Melipilla #PetMatch",
  ]
    .filter((linea): linea is string => linea !== null)
    .join("\n");

  return {
    alertaId: alerta.id,
    nombre,
    urgente: alerta.urgente,
    fotoUri: resolveFotoUrl(mascota.fotoUrl),
    infoRows: [
      [
        { label: "ESPECIE", value: especie },
        { label: "SECTOR / COMUNA", value: sectorComuna },
      ],
      [
        { label: "FECHA DE PÉRDIDA", value: fecha },
        { label: "IDENTIFICACIÓN", value: identificacion },
      ],
    ],
    senas,
    contactLabel: whatsappDigits ? "¿LO VISTE? ESCRIBE AL WHATSAPP" : "¿LO VISTE? AVÍSANOS EN PETMATCH",
    contacto,
    whatsappDigits,
    publicUrl,
    shareTitle: `SE BUSCA: ${nombre}`,
    shareText,
    fileName: `se-busca-${slug(mascota.nombre)}-story.png`,
  };
}
