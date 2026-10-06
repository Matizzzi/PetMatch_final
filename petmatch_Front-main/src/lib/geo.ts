import type { Coordenadas } from "@/types/requests";

const RADIO_TIERRA_KM = 6371;
const aRad = (grados: number) => grados * (Math.PI / 180);

/** Distancia en km entre dos puntos (fórmula de Haversine). */
export function distanciaKm(a: Coordenadas, b: Coordenadas): number {
  const dLat = aRad(b.latitud - a.latitud);
  const dLon = aRad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRad(a.latitud)) * Math.cos(aRad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const tieneCoordenadas = (p: Partial<Coordenadas>): p is Coordenadas =>
  typeof p.latitud === "number" && typeof p.longitud === "number";

export function formatearDistancia(a: Partial<Coordenadas>, b: Partial<Coordenadas>): string {
  if (!tieneCoordenadas(a) || !tieneCoordenadas(b)) return "Zona cercana";
  const km = distanciaKm(a, b);
  if (km < 0.1) return "Misma ubicación (< 100m)";
  if (km < 1) return `A ${Math.round(km * 1000)}m`;
  return `A ${km.toFixed(1)} km`;
}

export function urlRutaGoogleMaps(origen: Coordenadas, destino: Coordenadas): string {
  return (
    "https://www.google.com/maps/dir/?api=1" +
    `&origin=${origen.latitud},${origen.longitud}` +
    `&destination=${destino.latitud},${destino.longitud}`
  );
}
