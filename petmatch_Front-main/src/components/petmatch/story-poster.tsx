import { Image } from "expo-image";
import { Fragment, useEffect, type Ref } from "react";
import { StyleSheet, Text, View, type TextStyle } from "react-native";

import {
  POSTER_COLORS as C,
  POSTER_LAYOUT as L,
  POSTER_TEXT as T,
  posterColumns,
  posterFooterBoxes,
  type PosterData,
} from "@/lib/poster";
import { QrCode } from "./qr-code";

interface StoryPosterProps {
  data: PosterData;
  /** Ancho en puntos; el alto se deriva del ratio 9:16. */
  width: number;
  ref?: Ref<View>;
  /** Se llama cuando la foto terminó de cargar (o falló), para saber cuándo es seguro capturar. */
  onPhotoSettled?: () => void;
}

/** Afiche "SE BUSCA" 9:16. Todas las medidas salen de `POSTER_LAYOUT` escaladas a `width`. */
export function StoryPoster({ data, width, ref, onPhotoSettled }: StoryPosterProps) {
  const scale = width / L.width;
  const px = (n: number) => n * scale;
  const line = (centerY: number, fontSize: number, lineHeight = Math.round(fontSize * 1.25)): TextStyle => ({
    position: "absolute",
    top: px(centerY - lineHeight / 2),
    height: px(lineHeight),
    lineHeight: px(lineHeight),
    fontSize: px(fontSize),
  });
  const centered: TextStyle = { left: px(L.marginX), width: px(L.contentWidth), textAlign: "center" };

  const { pills, title, name } = L.header;
  const { info, footer, band, photo } = L;
  const columns = posterColumns();
  const boxes = posterFooterBoxes();
  const qrInner = footer.qr.size - 2 * (footer.qr.border + footer.qr.padding);

  useEffect(() => {
    if (!data.fotoUri) onPhotoSettled?.();
  }, [data.fotoUri, onPhotoSettled]);

  const pill = (text: string, backgroundColor: string, color: string) => (
    <View
      style={{
        height: px(pills.height),
        paddingHorizontal: px(pills.paddingX),
        borderRadius: px(pills.height / 2),
        backgroundColor,
        justifyContent: "center",
      }}
    >
      <Text
        style={[
          styles.text,
          { fontSize: px(pills.fontSize), lineHeight: px(pills.height), color, fontWeight: "900" },
        ]}
      >
        {text}
      </Text>
    </View>
  );

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width, height: px(L.height), backgroundColor: C.paper, overflow: "hidden" }}
    >
      <View style={[styles.fill, { height: px(L.header.height), backgroundColor: C.red }]} />

      <View
        style={[
          styles.row,
          { top: px(pills.centerY - pills.height / 2), height: px(pills.height), gap: px(pills.gap) },
        ]}
      >
        {pill(T.badge, C.yellow, C.redDark)}
        {data.urgente && pill(T.urgent, C.ink, C.paper)}
      </View>

      <Text
        numberOfLines={1}
        style={[styles.text, line(title.centerY, title.fontSize), centered, { color: C.paper, fontWeight: "900" }]}
      >
        {T.title}
      </Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={name.minFontSize / name.fontSize}
        style={[styles.text, line(name.centerY, name.fontSize), centered, { color: C.redSoft, fontWeight: "900" }]}
      >
        {data.nombre}
      </Text>

      <View
        style={[
          styles.photo,
          {
            left: px(L.marginX),
            top: px(photo.top),
            width: px(L.contentWidth),
            height: px(photo.height),
            borderRadius: px(photo.radius),
            borderWidth: px(photo.border),
          },
        ]}
      >
        {data.fotoUri ? (
          <Image
            source={{ uri: data.fotoUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            onLoad={() => onPhotoSettled?.()}
            onError={() => onPhotoSettled?.()}
          />
        ) : (
          <Text style={[styles.text, { fontSize: px(40), color: "#9CA3AF", fontWeight: "800" }]}>
            {T.photoPlaceholder}
          </Text>
        )}
      </View>

      {info.rows.map((labelY, rowIndex) =>
        data.infoRows[rowIndex].map((field, colIndex) => {
          const column = { left: px(colIndex === 0 ? columns.leftX : columns.rightX), width: px(columns.width) };
          return (
            <Fragment key={field.label}>
              <Text
                numberOfLines={1}
                style={[styles.text, line(labelY, info.labelFontSize), column, { color: C.muted, fontWeight: "800" }]}
              >
                {field.label}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.text,
                  line(labelY + info.labelToValue, info.valueFontSize),
                  column,
                  { color: C.ink, fontWeight: "800" },
                ]}
              >
                {field.value}
              </Text>
            </Fragment>
          );
        }),
      )}

      <Text
        numberOfLines={1}
        style={[
          styles.text,
          line(info.senas.labelCenterY, info.labelFontSize),
          { left: px(L.marginX), width: px(L.contentWidth), color: C.muted, fontWeight: "800" },
        ]}
      >
        SEÑAS PARTICULARES
      </Text>
      <Text
        numberOfLines={info.senas.maxLines}
        style={[
          styles.text,
          {
            position: "absolute",
            top: px(info.senas.firstLineCenterY - info.senas.lineHeight / 2),
            left: px(L.marginX),
            width: px(L.contentWidth),
            fontSize: px(info.senas.fontSize),
            lineHeight: px(info.senas.lineHeight),
            color: C.ink,
            fontWeight: "600",
          },
        ]}
      >
        {data.senas}
      </Text>

      <View
        style={{
          position: "absolute",
          left: px(boxes.contact.x),
          top: px(boxes.contact.y),
          width: px(boxes.contact.width),
          height: px(boxes.contact.height),
          borderRadius: px(footer.radius),
          backgroundColor: C.green,
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.text,
            line(footer.contact.labelOffsetY, footer.contact.labelFontSize),
            styles.contactText,
            { paddingHorizontal: px(footer.contact.paddingX), color: C.greenDark, fontWeight: "900" },
          ]}
        >
          {data.contactLabel}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={footer.contact.minPhoneFontSize / footer.contact.phoneFontSize}
          style={[
            styles.text,
            line(footer.contact.phoneOffsetY, footer.contact.phoneFontSize),
            styles.contactText,
            { paddingHorizontal: px(footer.contact.paddingX), color: C.paper, fontWeight: "900" },
          ]}
        >
          {data.contacto}
        </Text>
      </View>

      <View
        style={[
          styles.qrBox,
          {
            left: px(boxes.qr.x),
            top: px(boxes.qr.y),
            width: px(boxes.qr.size),
            height: px(boxes.qr.size),
            borderRadius: px(footer.qr.radius),
            borderWidth: px(footer.qr.border),
          },
        ]}
      >
        <QrCode value={data.publicUrl} size={px(qrInner)} color={C.ink} />
      </View>

      <View style={[styles.fill, { top: px(band.top), bottom: 0, backgroundColor: C.ink }]} />
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          line(band.brandCenterY, band.brandFontSize),
          styles.fullWidth,
          { color: C.paper, fontWeight: "800" },
        ]}
      >
        {T.brand}
      </Text>
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          line(band.subCenterY, band.subFontSize),
          styles.fullWidth,
          { color: C.bandSub, fontWeight: "600" },
        ]}
      >
        {T.bandSub}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
  row: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  photo: {
    position: "absolute",
    overflow: "hidden",
    borderColor: C.red,
    backgroundColor: C.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    left: 0,
    right: 0,
    textAlign: "center",
  },
  qrBox: {
    position: "absolute",
    backgroundColor: C.paper,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    left: 0,
    right: 0,
    textAlign: "center",
  },
});
