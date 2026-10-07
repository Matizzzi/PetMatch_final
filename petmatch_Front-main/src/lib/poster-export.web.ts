import type { PosterData, PosterExportAction } from "./poster";
import { renderPosterBlob } from "./poster-canvas";

let cache: { key: string; promise: Promise<Blob> } | null = null;

function obtenerBlob(data: PosterData): Promise<Blob> {
  const key = JSON.stringify(data);
  if (cache?.key === key) return cache.promise;
  const promise = renderPosterBlob(data);
  cache = { key, promise };
  promise.catch(() => {
    if (cache?.promise === promise) cache = null;
  });
  return promise;
}

function descargarBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Pre-renderiza el PNG al abrir el modal: Safari invalida la "user activation" si
 * `navigator.share` se llama después de una espera larga tras el click.
 */
export function preparePosterExport(data: PosterData): void {
  obtenerBlob(data).catch(() => {});
}

export const downloadPoster: PosterExportAction = async ({ data }) => {
  descargarBlob(await obtenerBlob(data), data.fileName);
  return { status: "ok", message: "Afiche descargado (1080×1920). ¡Súbelo a tus Historias o Estados!" };
};

export const sharePosterToWhatsApp: PosterExportAction = async ({ data }) => {
  const blob = await obtenerBlob(data);
  const file = new File([blob], data.fileName, { type: "image/png" });

  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: data.shareTitle, text: data.shareText });
      return { status: "ok", message: "¡Gracias por difundir! Cada contacto cuenta." };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { status: "cancelled", message: "" };
      }
    }
  }

  // Escritorio / navegadores sin Web Share de archivos: wa.me solo acepta texto.
  descargarBlob(blob, data.fileName);
  window.open(`https://wa.me/?text=${encodeURIComponent(data.shareText)}`, "_blank", "noopener,noreferrer");
  return {
    status: "ok",
    message: "Descargamos el afiche y abrimos WhatsApp con el texto. Adjunta la imagen desde tus descargas.",
  };
};
