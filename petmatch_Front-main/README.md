# PetMatch Frontend

Expo SDK 57 (React Native + web). Tres pantallas: inicio, publicar pérdida, reportar avistamiento.

## Estructura

```
src/
  app/           Rutas (Expo Router). (tabs) = Inicio / Pérdida / Reportar
  components/    UI por dominio: alerta, avistamiento, matches, forms, ai
  hooks/         Lógica de pantallas y formularios
  services/      Llamadas HTTP a la API
  lib/           Helpers (geo, afiche, códigos de cierre, IA)
  constants/     Melipilla, umbral de match, tema
  contexts/      Tema claro/oscuro
  types/         Contratos TS de la API
```

No hay login. Publicar es anónimo; el cierre usa el código de 8 caracteres.

## Cómo correrlo

Con el stack: `docker compose up` en `PetMatch_final/` → [http://localhost:3000](http://localhost:3000)

En local:

```bash
npm install
npx expo start
```
