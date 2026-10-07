import { Linking, PixelRatio } from "react-native";

import { POSTER_LAYOUT, type PosterData, type PosterExportAction, type PosterExportContext } from "./poster";

function getSharingModule(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("expo-sharing");
  } catch {
    return null;
  }
}

function getViewShotModule(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("react-native-view-shot");
  } catch {
    return null;
  }
}

function getMediaLibraryModule(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("expo-media-library");
  } catch {
    return null;
  }
}

async function capturarAfiche({ viewRef }: PosterExportContext): Promise<string> {
  if (!viewRef.current) throw new Error("El afiche aún no está listo.");
  const viewShot = getViewShotModule();
  if (!viewShot?.captureRef) {
    throw new Error(
      "La captura visual de afiches requiere una APK/build instalada. En Expo Go esta función no está disponible."
    );
  }
  // captureRef recibe puntos lógicos: dividir por la densidad para obtener 1080×1920 px reales.
  const ratio = PixelRatio.get();
  return viewShot.captureRef(viewRef, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    width: POSTER_LAYOUT.width / ratio,
    height: POSTER_LAYOUT.height / ratio,
  });
}

export const preparePosterExport: (data: PosterData) => void = () => {};

export const downloadPoster: PosterExportAction = async (context) => {
  let uri: string;
  try {
    uri = await capturarAfiche(context);
  } catch {
    // En Expo Go no existe el módulo de captura de vista nativa react-native-view-shot.
    if (context.data.publicUrl) {
      await Linking.openURL(context.data.publicUrl);
      return {
        status: "ok",
        message: "Abriendo la ficha web de la alerta. La descarga directa del PNG a la galería requiere el APK instalado.",
      };
    }
    throw new Error(
      "La descarga directa a la galería requiere el APK instalado en tu teléfono (función nativa no disponible en Expo Go)."
    );
  }

  // Carga defensiva de expo-media-library
  const mediaLibrary = getMediaLibraryModule();
  if (mediaLibrary?.requestPermissionsAsync && mediaLibrary?.Asset?.create) {
    try {
      const permiso = await mediaLibrary.requestPermissionsAsync(true, ["photo"]);
      if (permiso?.granted) {
        await mediaLibrary.Asset.create(uri);
        return { status: "ok", message: "Afiche guardado en tu galería. ¡Súbelo a tus Historias o Estados!" };
      }
    } catch {
      // Si la API nativa de galería falla, continúa con el fallback
    }
  }

  // Fallback: compartir el archivo de imagen para guardarlo o enviarlo
  const sharing = getSharingModule();
  if (sharing?.isAvailableAsync && (await sharing.isAvailableAsync())) {
    await sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle: "Guardar o compartir afiche",
    });
    return { status: "ok", message: "Elige dónde guardar o enviar tu afiche." };
  }

  return { status: "ok", message: "Afiche generado con éxito." };
};

export const sharePosterToWhatsApp: PosterExportAction = async (context) => {
  const sharing = getSharingModule();
  const sharingAvailable = sharing?.isAvailableAsync ? await sharing.isAvailableAsync() : false;
  const viewShot = getViewShotModule();

  if (sharingAvailable && viewShot?.captureRef) {
    try {
      const uri = await capturarAfiche(context);
      await sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: "Compartir afiche en WhatsApp",
      });
      return { status: "ok", message: "Elige WhatsApp para enviarlo a un chat o publicarlo en tu Estado." };
    } catch {
      // Si falla la captura nativa, recurre al enlace directo
    }
  }

  await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(context.data.shareText)}`);
  return { status: "ok", message: "Abrimos WhatsApp con el texto y enlace directo de la alerta." };
};
