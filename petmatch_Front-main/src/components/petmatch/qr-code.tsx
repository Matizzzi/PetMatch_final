import { useMemo } from "react";
import Svg, { Path, Rect } from "react-native-svg";

import { createQrMatrix, qrMatrixToPath } from "@/lib/qr";

interface QrCodeProps {
  value: string;
  size: number;
  color?: string;
  backgroundColor?: string;
}

export function QrCode({ value, size, color = "#111827", backgroundColor = "#FFFFFF" }: QrCodeProps) {
  const { modules, path } = useMemo(() => {
    const matrix = createQrMatrix(value);
    return { modules: matrix.size, path: qrMatrixToPath(matrix) };
  }, [value]);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${modules} ${modules}`}
      accessibilityLabel="Código QR de la alerta"
    >
      <Rect width={modules} height={modules} fill={backgroundColor} />
      <Path d={path} fill={color} />
    </Svg>
  );
}
