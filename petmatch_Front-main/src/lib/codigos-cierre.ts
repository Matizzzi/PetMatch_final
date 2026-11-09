const STORAGE_KEY = "petmatch.codigosCierre";

function mapa(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function guardarCodigoCierre(alertaId: string, codigo: string) {
  if (typeof localStorage === "undefined") return;
  const actual = mapa();
  actual[alertaId] = normalizarCodigoCierre(codigo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(actual));
}

export function obtenerCodigoCierre(alertaId: string): string | null {
  return mapa()[alertaId] ?? null;
}

export function normalizarCodigoCierre(codigo: string): string {
  return codigo.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatearCodigoCierre(codigo: string): string {
  const limpio = normalizarCodigoCierre(codigo);
  if (limpio.length <= 4) return limpio;
  return `${limpio.slice(0, 4)}-${limpio.slice(4)}`;
}
