import {
  POSTER_COLORS as C,
  POSTER_LAYOUT as L,
  POSTER_TEXT as T,
  posterColumns,
  posterFooterBoxes,
  type PosterData,
} from "./poster";
import { createQrMatrix } from "./qr";

const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function font(weight: number, size: number): string {
  return `${weight} ${size}px ${FONT_STACK}`;
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && ctx.measureText(`${text.slice(0, end).trimEnd()}…`).width > maxWidth) end--;
  return `${text.slice(0, end).trimEnd()}…`;
}

/** Reduce el tamaño de fuente hasta `minSize` para que quepa; si aún no cabe, recorta con "…". */
function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  weight: number,
  size: number,
  minSize = size,
) {
  let current = size;
  ctx.font = font(weight, current);
  while (current > minSize && ctx.measureText(text).width > maxWidth) {
    current -= 2;
    ctx.font = font(weight, current);
  }
  ctx.fillText(ellipsize(ctx, text, maxWidth), x, y);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (let i = 0; i < words.length; i++) {
    const candidate = current ? `${current} ${words[i]}` : words[i];
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
      continue;
    }
    lines.push(ellipsize(ctx, current, maxWidth));
    current = words[i];
    if (lines.length === maxLines - 1) {
      lines.push(ellipsize(ctx, words.slice(i).join(" "), maxWidth));
      return lines;
    }
  }
  if (current) lines.push(ellipsize(ctx, current, maxWidth));
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la foto: ${src}`));
    img.src = src;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function drawPills(ctx: CanvasRenderingContext2D, urgente: boolean) {
  const { pills } = L.header;
  const items: { text: string; bg: string; color: string }[] = [{ text: T.badge, bg: C.yellow, color: C.redDark }];
  if (urgente) items.push({ text: T.urgent, bg: C.ink, color: C.paper });

  ctx.font = font(900, pills.fontSize);
  const widths = items.map((item) => ctx.measureText(item.text).width + pills.paddingX * 2);
  const total = widths.reduce((a, b) => a + b, 0) + pills.gap * (items.length - 1);
  let x = (L.width - total) / 2;
  const top = pills.centerY - pills.height / 2;

  items.forEach((item, i) => {
    ctx.fillStyle = item.bg;
    ctx.beginPath();
    ctx.roundRect(x, top, widths[i], pills.height, pills.height / 2);
    ctx.fill();
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, x + widths[i] / 2, pills.centerY);
    x += widths[i] + pills.gap;
  });
}

function drawQr(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number) {
  const matrix = createQrMatrix(value);
  const cell = size / matrix.size;
  ctx.fillStyle = C.ink;
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (!matrix.isDark(row, col)) continue;
      // Bordes redondeados a píxel entero para evitar líneas finas entre módulos.
      const x0 = Math.round(x + col * cell);
      const y0 = Math.round(y + row * cell);
      ctx.fillRect(x0, y0, Math.round(x + (col + 1) * cell) - x0, Math.round(y + (row + 1) * cell) - y0);
    }
  }
}

function drawPoster(ctx: CanvasRenderingContext2D, data: PosterData, photoImg: HTMLImageElement | null) {
  const { header, photo, info, footer, band } = L;
  const centerX = L.width / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, L.width, L.height);
  ctx.fillStyle = C.red;
  ctx.fillRect(0, 0, L.width, header.height);

  drawPills(ctx, data.urgente);

  ctx.fillStyle = C.paper;
  drawFittedText(ctx, T.title, centerX, header.title.centerY, L.contentWidth, 900, header.title.fontSize);
  ctx.fillStyle = C.redSoft;
  drawFittedText(
    ctx,
    data.nombre,
    centerX,
    header.name.centerY,
    L.contentWidth,
    900,
    header.name.fontSize,
    header.name.minFontSize,
  );

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(L.marginX, photo.top, L.contentWidth, photo.height, photo.radius);
  ctx.clip();
  ctx.fillStyle = C.soft;
  ctx.fillRect(L.marginX, photo.top, L.contentWidth, photo.height);
  if (photoImg) {
    drawImageCover(ctx, photoImg, L.marginX, photo.top, L.contentWidth, photo.height);
  } else {
    ctx.fillStyle = "#9CA3AF";
    ctx.font = font(800, 40);
    ctx.fillText(T.photoPlaceholder, centerX, photo.top + photo.height / 2);
  }
  ctx.restore();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = photo.border;
  ctx.beginPath();
  ctx.roundRect(
    L.marginX + photo.border / 2,
    photo.top + photo.border / 2,
    L.contentWidth - photo.border,
    photo.height - photo.border,
    photo.radius - photo.border / 2,
  );
  ctx.stroke();

  const columns = posterColumns();
  ctx.textAlign = "left";
  info.rows.forEach((labelY, rowIndex) => {
    data.infoRows[rowIndex].forEach((field, colIndex) => {
      const x = colIndex === 0 ? columns.leftX : columns.rightX;
      ctx.fillStyle = C.muted;
      drawFittedText(ctx, field.label, x, labelY, columns.width, 800, info.labelFontSize);
      ctx.fillStyle = C.ink;
      drawFittedText(ctx, field.value, x, labelY + info.labelToValue, columns.width, 800, info.valueFontSize);
    });
  });

  ctx.fillStyle = C.muted;
  drawFittedText(ctx, "SEÑAS PARTICULARES", L.marginX, info.senas.labelCenterY, L.contentWidth, 800, info.labelFontSize);
  ctx.fillStyle = C.ink;
  ctx.font = font(600, info.senas.fontSize);
  wrapLines(ctx, data.senas, L.contentWidth, info.senas.maxLines).forEach((text, i) => {
    ctx.fillText(text, L.marginX, info.senas.firstLineCenterY + i * info.senas.lineHeight);
  });

  const boxes = posterFooterBoxes();
  const { contact } = footer;
  const contactCenterX = boxes.contact.x + boxes.contact.width / 2;
  const contactTextWidth = boxes.contact.width - contact.paddingX * 2;
  ctx.textAlign = "center";
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.roundRect(boxes.contact.x, boxes.contact.y, boxes.contact.width, boxes.contact.height, footer.radius);
  ctx.fill();
  ctx.fillStyle = C.greenDark;
  drawFittedText(
    ctx,
    data.contactLabel,
    contactCenterX,
    boxes.contact.y + contact.labelOffsetY,
    contactTextWidth,
    900,
    contact.labelFontSize,
    18,
  );
  ctx.fillStyle = C.paper;
  drawFittedText(
    ctx,
    data.contacto,
    contactCenterX,
    boxes.contact.y + contact.phoneOffsetY,
    contactTextWidth,
    900,
    contact.phoneFontSize,
    contact.minPhoneFontSize,
  );

  const { qr } = footer;
  ctx.fillStyle = C.paper;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = qr.border;
  ctx.beginPath();
  ctx.roundRect(
    boxes.qr.x + qr.border / 2,
    boxes.qr.y + qr.border / 2,
    boxes.qr.size - qr.border,
    boxes.qr.size - qr.border,
    qr.radius,
  );
  ctx.fill();
  ctx.stroke();
  const qrInset = qr.border + qr.padding;
  drawQr(ctx, data.publicUrl, boxes.qr.x + qrInset, boxes.qr.y + qrInset, boxes.qr.size - qrInset * 2);

  ctx.fillStyle = C.ink;
  ctx.fillRect(0, band.top, L.width, L.height - band.top);
  ctx.fillStyle = C.paper;
  drawFittedText(ctx, T.brand, centerX, band.brandCenterY, L.contentWidth, 800, band.brandFontSize);
  ctx.fillStyle = C.bandSub;
  drawFittedText(ctx, T.bandSub, centerX, band.subCenterY, L.contentWidth, 600, band.subFontSize);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen."))), "image/png");
  });
}

/** Genera el afiche 1080×1920 como PNG. Solo web (usa DOM / Canvas 2D). */
export async function renderPosterBlob(data: PosterData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = L.width;
  canvas.height = L.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no soporta Canvas 2D.");

  await document.fonts?.ready;
  const photoImg = data.fotoUri ? await loadImage(data.fotoUri).catch(() => null) : null;

  drawPoster(ctx, data, photoImg);
  try {
    return await canvasToBlob(canvas);
  } catch (error) {
    // Si el servidor de la foto no envía CORS el canvas queda "tainted": se exporta sin foto.
    if (!photoImg || !(error instanceof DOMException && error.name === "SecurityError")) throw error;
    drawPoster(ctx, data, null);
    return canvasToBlob(canvas);
  }
}
