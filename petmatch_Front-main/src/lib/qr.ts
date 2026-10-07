import { create } from "qrcode";

export interface QrMatrix {
  size: number;
  isDark: (row: number, col: number) => boolean;
}

export function createQrMatrix(value: string): QrMatrix {
  const { modules } = create(value, { errorCorrectionLevel: "M" });
  return {
    size: modules.size,
    isDark: (row, col) => modules.get(row, col) === 1,
  };
}

/** Path SVG en coordenadas de módulo (1 unidad = 1 módulo), fusionando módulos contiguos por fila. */
export function qrMatrixToPath(matrix: QrMatrix): string {
  let d = "";
  for (let row = 0; row < matrix.size; row++) {
    let col = 0;
    while (col < matrix.size) {
      if (!matrix.isDark(row, col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < matrix.size && matrix.isDark(row, col)) col++;
      d += `M${start} ${row}h${col - start}v1h-${col - start}z`;
    }
  }
  return d;
}
