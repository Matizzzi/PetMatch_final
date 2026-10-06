import { AlertaPerdida, ReporteAvistamiento } from "@/types/api";

interface MapCenter {
  latitude: number;
  longitude: number;
}

export function generateLeafletHtml(
  alertas: AlertaPerdida[],
  avistamientos: ReporteAvistamiento[],
  center: MapCenter
): string {
  const safeData = {
    center: [center?.latitude ?? -33.6869, center?.longitude ?? -71.2149],
    alertas: (alertas || [])
      .filter((a) => typeof a.latitud === "number" && typeof a.longitud === "number")
      .map((a) => ({
        lat: a.latitud,
        lng: a.longitud,
        nombre: a.mascota?.nombre || "Mascota",
        especie: a.mascota?.especie || "Animal",
        sector: a.sector || "Melipilla",
        urgente: !!a.urgente,
      })),
    avistamientos: (avistamientos || [])
      .filter((av) => typeof av.latitud === "number" && typeof av.longitud === "number")
      .map((av) => ({
        lat: av.latitud,
        lng: av.longitud,
        especie: av.especie || "Animal",
        descripcion: (av.descripcion || "").replace(/\r?\n/g, " ").trim(),
        comuna: av.comuna || "Melipilla",
      })),
  };

  const payload = JSON.stringify(safeData);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; border-radius: 20px; background: #E5E3DF; }
    .leaflet-popup-content-wrapper { border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    try {
      var data = ${payload};
      var center = (data && data.center && data.center.length === 2) ? data.center : [-33.6869, -71.2149];
      var map = L.map('map', { zoomControl: true }).setView(center, 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      setTimeout(function() { map.invalidateSize(); }, 300);
      setTimeout(function() { map.invalidateSize(); }, 1000);
      window.addEventListener('resize', function() { map.invalidateSize(); });

      // 1. Pines de Alertas de Pérdida (Rojos / Naranjas)
      data.alertas.forEach(function(a) {
        var color = a.urgente ? '#EF4444' : '#F97316';
        var marker = L.circleMarker([a.lat, a.lng], {
          radius: 9,
          fillColor: color,
          color: '#FFFFFF',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map);
        marker.bindPopup('<div style="font-family:sans-serif;font-size:13px;line-height:1.4;">' +
          '<b style="color:' + color + ';font-size:14px;">Pérdida: ' + a.nombre + ' (' + a.especie + ')</b><br/>' +
          'Sector: ' + a.sector + '<br/>' +
          '<span style="color:#6B7280;font-size:11px;">Zona reportada por el dueño</span></div>');
      });

      // 2. Pines de Avistamientos Callejeros (Verdes)
      data.avistamientos.forEach(function(av) {
        var color = '#10B981';
        var marker = L.circleMarker([av.lat, av.lng], {
          radius: 8,
          fillColor: color,
          color: '#FFFFFF',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map);
        marker.bindPopup('<div style="font-family:sans-serif;font-size:13px;line-height:1.4;">' +
          '<b style="color:' + color + ';font-size:14px;">Avistamiento: ' + av.especie.toUpperCase() + '</b><br/>' +
          '"' + av.descripcion + '"<br/>' +
          '<b>' + av.comuna + '</b><br/>' +
          '<span style="color:#059669;font-size:11px;">Punto donde un testigo vio al animal</span></div>');
      });
    } catch(err) {
      console.error('Error cargando mapa:', err);
    }
  </script>
</body>
</html>`;
}
