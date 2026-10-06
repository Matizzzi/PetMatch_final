# Contexto completo del proyecto PetMatch

> Documento preparado para entregar como contexto a otro asistente de IA. Describe el árbol de trabajo revisado el 5 de octubre de 2026. Está basado en los archivos presentes y distingue capacidades implementadas de lo que anuncian los README. No contiene credenciales: los `.env`, archivos de despliegue y configuración incluyen valores sensibles o de ejemplo; no los copies a prompts públicos.

## 1. Resumen ejecutivo

PetMatch es una plataforma comunitaria para publicar mascotas perdidas y avistamientos de animales, explorar reportes en una interfaz con mapa/listados y encontrar posibles coincidencias entre ambos tipos de reporte. Se compone de:

- **Frontend**: aplicación universal Expo Router + React Native + TypeScript, compilable como web estática y también configurada para Android/iOS.
- **Backend**: API REST en FastAPI/Python, ORM SQLAlchemy y PostgreSQL (Neon por defecto; PostgreSQL local opcional con Docker).
- **Coincidencias**: reglas deterministas por distancia, tiempo y palabras clave; un endpoint aparte usa Gemini Vision para analizar fotos y comparar una pareja de imágenes.
- **Despliegue local**: Docker Compose coordina backend, frontend detrás de Nginx, pgAdmin y una base local opcional.

El foco mostrado por la interfaz y coordenadas predeterminadas es Melipilla, Chile. La API mantiene datos en español y nombres de campos camelCase para interoperar con el cliente.

## 2. Arquitectura y flujo general

```text
Navegador / app Expo
  ├─ Expo Router: inicio, Perdida, Reportar
  ├─ servicios TS (fetch, auth, almacenamiento)
  └─ EXPO_PUBLIC_API_URL ──> FastAPI :8000
                               ├─ /api/auth, /api/me
                               ├─ /api/alertas
                               ├─ /api/avistamientos
                               ├─ /api/matches
                               ├─ /api/ia
                               ├─ /uploads (fotos locales)
                               └─ SQLAlchemy ──> PostgreSQL/Neon

Docker frontend :3000 -> Nginx :80 -> /api y /uploads al servicio backend
```

El proceso de publicar una alerta crea primero una `Mascota` y luego una `AlertaPerdida`; después intenta compararla con hasta 50 avistamientos recientes. Publicar un avistamiento intenta compararlo con alertas activas. Los resultados de reglas se almacenan en `matches`. Las fotografías se guardan en `petmatch_Backend-main/uploads` cuando se envían como archivo, y se exponen en `/uploads/{nombre}`.

## 3. Árbol del repositorio

```text
petmatch/
├── AGENTS.md
├── README.md
├── .env                    # local, no compartir; contiene configuración sensible
├── .env.example            # plantilla; validar y rotar cualquier secreto filtrado
├── .gitignore
├── docker-compose.yml
├── render.yaml
├── pgadmin/
│   └── servers.json        # conexión pgAdmin preconfigurada
├── petmatch_Backend-main/  # API independiente, tiene su propio .git
│   ├── app/
│   ├── uploads/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   ├── render.yaml
│   ├── README.md
│   ├── .env, .env.example, .gitignore, .dockerignore
│   └── .venv/              # entorno virtual local, no es código fuente
└── petmatch_Front-main/    # Expo/React Native Web independiente, tiene su propio .git
    ├── src/
    ├── assets/
    ├── .vscode/
    ├── app.json
    ├── package.json, package-lock.json
    ├── Dockerfile, nginx.conf, vercel.json (si está presente)
    ├── eas.json, tsconfig.json, expo-env.d.ts
    ├── AGENTS.md, README.md, LICENSE
    ├── .env.example, .gitignore, .dockerignore
    ├── .expo/               # estado local Expo
    └── node_modules/        # dependencias instaladas, no fuente
```

La carpeta `pgadmin/servers.json` configura una conexión guardada a Neon. En los dos subproyectos aparece una carpeta `.git`, por lo que la raíz actúa como contenedor de proyectos y no necesariamente como un único repositorio Git convencional.

## 4. Backend: archivos y responsabilidades

### `petmatch_Backend-main/app/`

- `main.py`: crea la app FastAPI, intenta crear las tablas al arrancar, habilita CORS permisivo, monta `/uploads`, registra routers y define `GET /` como health/status.
- `api/auth.py`: `POST /api/auth`; endpoint combinado de registro e inicio de sesión. Normaliza email, valida contraseña de usuario existente o crea cuenta si se aporta nombre, devuelve JWT.
- `api/deps.py`: extrae token de `Authorization: Bearer` o cookie `sesion`; dependencias para exigir usuario o resolver uno opcional.
- `api/me.py`: `GET /api/me`, perfil del usuario autenticado.
- `api/alertas.py`: listar alertas (`incluir_resueltas`), resolver alerta y crear alerta mediante multipart/form-data, incluyendo datos de mascota, ubicación, contacto opcional y foto. Sin sesión usa/crea usuario comunitario. Al final dispara el cálculo de matches.
- `api/avistamientos.py`: lista los últimos 50 avistamientos y permite crear reporte multipart con foto opcional, ubicación y datos de contacto; si no hay foto/URL usa imagen de reserva. Dispara cálculo de matches.
- `api/matches.py`: listar con filtros `alertaId`, `minScore` y `limit`; consultar por alerta; recalcular coincidencias para avistamientos.
- `api/vision.py`: endpoints de análisis de imagen y comparación visual forense, recibiendo archivo o URL, cargando bytes y delegando a `vision_ai.py`.
- `core/config.py`: carga configuración de entorno (DB, JWT, URL pública, directorio de uploads, clave de Gemini). Hay valores por defecto embebidos; deben tratarse como secretos expuestos y reemplazarse.
- `core/database.py`: engine SQLAlchemy con `pool_pre_ping`, sesiones, `Base` y generador de IDs con prefijo más 24 caracteres hexadecimales.
- `core/security.py`: hash/verificación bcrypt y generación/decodificación JWT usando `usuarioId`, vencimiento e identificador de algoritmo configurado.
- `models/usuario.py`: tabla `usuarios`; email único, hash de contraseña, nombre, teléfono opcional y relaciones con mascotas/alertas.
- `models/mascota.py`: tabla `mascotas`; nombre, especie, descripción, foto, collar, chip, condición médica y usuario propietario.
- `models/alerta.py`: tabla `alertas_perdida`; FK a mascota/usuario, coordenadas, fecha, comuna/sector, urgencia, WhatsApp y estado activa.
- `models/avistamiento.py`: tabla `reportes_avistamiento`; especie, descripción, foto, coordenadas, fecha, comuna, contacto y bandera procesado.
- `models/match.py`: tabla `matches`; FK a alerta y avistamiento, tres scores y score total, bandera notificado; pareja alerta-avistamiento única.
- `models/__init__.py`: importa/exporta modelos para registrarlos antes de crear tablas.
- `schemas/auth.py`, `alerta.py`, `avistamiento.py`, `match.py`: modelos Pydantic para validación y serialización de requests/responses; usan `from_attributes` donde se serializa ORM.
- `schemas/__init__.py`: exports agrupados.
- `services/matching.py`: normalización simple de texto, Haversine, scores de distancia/tiempo/texto, compatibilidad de especies y persistencia de coincidencias con umbral 50.
- `services/vision_ai.py`: llamadas HTTP a Gemini multimodal; análisis descriptivo de una foto y comparación de dos fotos con prompt estructurado y fallback de modelos. Comprime imágenes con Pillow si es posible.
- `uploads/.gitkeep`: conserva el directorio de fotos vacío en Git; las fotos subidas son datos, no código.

### Reglas actuales de matching

- Requiere especies compatibles (perro/canino o gato/felino, con comprobaciones por subcadena).
- Distancia Haversine: 100 hasta 0,5 km; 92 hasta 1 km; 80 hasta 2,5; 65 hasta 5; 40 hasta 10; 20 hasta 20; 0 después.
- Tiempo absoluto entre fecha de pérdida y avistamiento: 100 hasta 24 h; 85 hasta 72 h; 70 hasta 7 días; 50 hasta 14; 30 hasta 30; 10 después.
- Texto: elimina acentos/signos, usa palabras de al menos tres letras y quita una lista fija de stopwords. Si faltan términos da 50; si no hay intersección da 30; con coincidencias parte en 40 y escala hasta 100.
- Total = 55% distancia + 25% tiempo + 20% texto. Solo guarda `scoreTotal >= 50`; evita duplicados con consulta y constraint único.
- El cálculo no usa IA ni análisis visual; Gemini está disponible por rutas distintas.

### Configuración backend

- `requirements.txt`: FastAPI, Uvicorn, Pydantic/settings, SQLAlchemy, driver psycopg2, multipart, JWT, bcrypt, dotenv y Pillow.
- `Dockerfile`: Python 3.11 slim, instala requirements y ejecuta Uvicorn en `${PORT:-8000}`.
- `docker-compose.yml` dentro del backend: variante independiente para levantar API.
- `render.yaml`: despliegue Render del backend.
- `README.md`: instrucciones de ejecución/API; algunos endpoints que lista son resúmenes, consultar router para comportamiento real.
- `.env`, `.env.example`: configuración local. No pegar su contenido en prompts o issues.
- `.gitignore`, `.dockerignore`: exclusiones Git/imagen Docker.
- `.venv/`: entorno virtual local; se excluye del inventario lógico.

## 5. Frontend: archivos y responsabilidades

### Enrutamiento y pantallas (`petmatch_Front-main/src/app/`)

- `_layout.tsx`: layout raíz; carga fuentes Alfa Slab One, Lora y Special Elite, controla splash screen, envuelve navegación con tema y autenticación.
- `(tabs)/_layout.tsx`: navegación tab con barra flotante personalizada.
- `(tabs)/index.tsx`: pantalla principal; obtiene alertas, avistamientos y matches, muestra mapa, filtros, búsqueda, tarjetas, banner de seguridad, refresco, modal de coincidencias y afiche.
- `(tabs)/perdida.tsx`: formulario para publicar mascota perdida; incluye foto, atributos de mascota, urgencia, contacto y análisis de foto; requiere revisar el archivo para el detalle de cada campo/validación.
- `(tabs)/reportar.tsx`: formulario comunitario para publicar un avistamiento; foto, ubicación y datos del testigo.

### Componentes (`src/components/`)

- `themed-text.tsx`, `themed-view.tsx`: primitivas que aplican colores/estilos del tema.
- `floating-tab-bar.tsx`: navegación visual flotante compartida.
- `petmatch/card.tsx` y `card.styles.ts`: tarjeta de alerta perdida y acciones (contacto, compartir, matches/afiche).
- `petmatch/sighting-card.tsx` y `.styles.ts`: tarjeta de avistamiento, imagen, fecha relativa y contacto por WhatsApp.
- `petmatch/filter-chips.tsx`: filtros por todas, urgente, perro, gato y avistamientos.
- `petmatch/empty-state.tsx`: vista vacía/error con acción de recuperación.
- `petmatch/map-section.tsx`: mapa para plataformas nativas usando `react-native-maps`.
- `petmatch/map-section.web.tsx`: implementación específica web; Expo resolverá el archivo por plataforma.
- `petmatch/map.utils.ts`, `map.styles.ts`: datos/utilidades y estilos del mapa.
- `petmatch/home.styles.ts`: estilos de pantalla principal.
- `petmatch/matches-modal.tsx` y estilos: lista de posibles matches y detalles.
- `petmatch/poster-modal.tsx` y estilos: afiche descargable/compartible de mascota perdida.

### Estado, servicios y tipos (`src/`)

- `contexts/auth-context.tsx`: expone usuario, carga inicial, login, registro y logout a la app.
- `contexts/theme-context.tsx`: estado `light`/`dark`, lectura/persistencia de preferencia y colores actuales.
- `constants/theme.ts`: paletas, fuentes, espaciados e inset/medidas de navegación; importa `global.css`.
- `global.css`: estilos globales CSS (especialmente web).
- `hooks/use-theme.ts`: acceso simplificado a colores del contexto.
- `hooks/use-color-scheme.ts`, `use-color-scheme.web.ts`: adaptación de esquema del sistema, con hidratación especial web.
- `services/api.ts`: resuelve API URL según plataforma/host/env, normaliza URL de fotos y hace fetch con JSON/FormData, token opcional y fallback a Render si falla la conexión local.
- `services/auth.ts`: login/registro, guarda token, consulta `/api/me`, logout.
- `services/storage.ts`: en web usa `localStorage`; en iOS/Android usa Expo SecureStore con fallback en memoria para token. Guarda tema también por plataforma.
- `types/api.ts`: tipos TypeScript para usuario, mascota, alerta, avistamiento, match y error.

### Recursos y configuración de frontend

- `assets/images/`: icono, splash, favicon, logos/tutorial y recursos gráficos de pestañas/Android.
- `assets/expo.icon/`: configuración/activos para el icono iOS generado por Expo.
- `.vscode/`: preferencias locales del editor.
- `package.json`: Expo Router como entry point; SDK 57 (`expo ~57.0.13`), React 19.2.3, RN 0.86.2 y módulos Expo; scripts `start`, `android`, `ios`, `web`, `build`, `lint`.
- `package-lock.json`: versiones instaladas bloqueadas.
- `app.json`: identidad Expo, iconos/splash, scheme, mapas de Google, router, plugins, salida web estática y ajustes EAS.
- `eas.json`: perfiles de compilación EAS.
- `tsconfig.json`: configuración TypeScript y alias `@` (consultar archivo para detalles).
- `expo-env.d.ts`: tipos globales Expo.
- `Dockerfile`: compila web estática con Node y publica `dist` en Nginx.
- `nginx.conf`: SPA fallback, gzip, caché de activos y proxy `/api` y `/uploads` a backend.
- `.env.example`: plantilla de `EXPO_PUBLIC_API_URL` sin necesidad de compartir valores reales.
- `AGENTS.md`: instrucción del repo de consultar documentación versionada Expo SDK 57 antes de editar código Expo.
- `README.md`: guía base Expo generada con create-expo-app; puede no reflejar toda la funcionalidad PetMatch.
- `LICENSE`: licencia del cliente.
- `.expo/`, `node_modules/`: estado y paquetes instalados; no son fuente propia.

## 6. Datos principales y relaciones

```text
Usuario 1 ── N Mascota 1 ── N AlertaPerdida
Usuario 1 ── N AlertaPerdida
AlertaPerdida N ── N ReporteAvistamiento mediante Match
```

`Match` materializa cada pareja y conserva valores independientes de distancia, tiempo, texto y total. Las alertas mantienen `activa` para representar casos abiertos/cerrados; los avistamientos tienen `procesado` para señalar si pasaron por la búsqueda de coincidencias. Los timestamps se generan con UTC en los modelos y las relaciones permiten devolver objetos anidados.

## 7. API observada

| Método y ruta | Función | Autenticación observada |
|---|---|---|
| `GET /` | estado, versión y ruta de docs | No |
| `POST /api/auth` | login o registro unificado, responde token y usuario | No |
| `GET /api/me` | perfil actual | Sí, Bearer o cookie `sesion` |
| `GET /api/alertas?incluir_resueltas=` | lista alertas, opcionalmente solo activas | No |
| `POST /api/alertas` | crea mascota + alerta multipart; acepta usuario invitado | Opcional |
| `PATCH /api/alertas/{id}/resolver` | cierra alerta | No se ve dependencia de auth en router |
| `GET /api/avistamientos` | lista últimos 50 | No |
| `POST /api/avistamientos` | crea avistamiento multipart y ejecuta matching | No se ve dependencia de auth |
| `GET /api/matches` | lista por umbral/alerta/límite | No |
| `GET /api/matches/alerta/{id}` | matches de una alerta | No |
| `POST /api/matches/recalcular-todos` | fuerza cálculo sobre avistamientos | No se ve dependencia de auth |
| `POST /api/ia/analizar` | analiza foto/URL con Gemini | No se ve dependencia de auth |
| Rutas adicionales bajo `/api/ia` | comparación biométrica entre dos fotos | Revisar `api/vision.py` para esquema exacto |
| `GET /uploads/{archivo}` | sirve archivos de imágenes | No |

La ausencia de dependencias de autenticación en ciertos routers es una observación del código, no una afirmación de que esas operaciones deban permanecer públicas.

## 8. Ejecución y despliegue

- Raíz: `docker compose up -d --build`; frontend en `localhost:3000`, backend en `localhost:8000`, pgAdmin en `localhost:5050`.
- PostgreSQL por defecto es Neon configurado vía `DATABASE_URL`. La base local se activa con el perfil Compose `local-db` y expone `5432`.
- Frontend Docker recibe `EXPO_PUBLIC_API_URL` como build arg y sirve el bundle estático mediante Nginx. Este proxy evita que el browser tenga que hablar con backend por otro origen cuando usa la URL del frontend.
- Backend Docker monta `app` y `uploads` en desarrollo y ofrece healthcheck contra `/`.
- Hay despliegues Render en `render.yaml` raíz y backend; el frontend permite export web estático. Revisar configuración real/secretos antes de desplegar.
- Expo documenta para SDK 57 la combinación React Native 0.86, React 19.2.3 y React Native Web 0.21, coherente con `package.json` de este proyecto. Documentación consultada: [referencia Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

## 9. Consideraciones, límites y puntos a verificar

1. **Secretos y credenciales**: evitar compartir `.env`, `render.yaml`, `app.json`, `servers.json` y defaults de `core/config.py` sin revisar. Se observan claves/contraseñas embebidas en archivos versionables; asumir comprometidos y rotarlos (DB, JWT, Gemini, Google Maps, pgAdmin) antes de uso público. Este documento no reproduce valores.
2. **Seguridad API**: CORS permite cualquier origen; endpoints de resolución, reporte, recálculo y visión no muestran auth en sus routers. Revisar permisos, límites de subida, validación de URL y rate limits antes de producción.
3. **Almacenamiento de fotos**: el almacenamiento de uploads es filesystem local. En plataformas efímeras puede perderse al recrear el contenedor, salvo volumen o servicio de objetos configurado.
4. **Transacción**: el fichero se escribe antes de confirmar los registros; no se ve limpieza del fichero si falla la transacción.
5. **Matching**: es heurístico y no una identificación fiable. Solo evalúa últimos 50 reportes en algunos caminos, y la regla de texto es una intersección de palabras sencilla. La comparación visual por Gemini es otra capacidad y su resultado también requiere revisión humana.
6. **Exposición de usuario comunitario**: las alertas anónimas quedan asignadas al mismo usuario invitado fijo.
7. **Modelo de esquema**: `create_all` crea tablas faltantes al iniciar, pero no gestiona migraciones evolutivas.
8. **URL y aplicación**: URL de Render, geografía por defecto y texto de Melipilla están definidos explícitamente; comprobar si se busca ampliar cobertura.
9. **Verificación**: este trabajo es un inventario/documentación estática. No se ejecutaron pruebas, builds ni llamadas a servicios externos.

## 10. Prompt listo para pasar a otra IA

```text
Estás ayudando con PetMatch, una plataforma comunitaria para mascotas perdidas y avistamientos, con foco actual en Melipilla, Chile. El repositorio contiene dos subproyectos: `petmatch_Front-main` es frontend universal Expo SDK 57 / React Native 0.86 / React 19 / TypeScript con Expo Router, pantalla principal de alertas y avistamientos, formularios para publicar, mapa, filtros, temas, autenticación, afiches y modales de matches. `petmatch_Backend-main` es API FastAPI + SQLAlchemy + PostgreSQL (Neon por defecto), con modelos Usuario, Mascota, AlertaPerdida, ReporteAvistamiento y Match. Docker Compose de raíz publica web en 3000, API en 8000, pgAdmin en 5050 y permite PostgreSQL local opcional. Nginx sirve el bundle web y proxifica `/api` y `/uploads`.

El matching automático solo es heurístico: compatibilidad de especie, distancia Haversine (55%), tiempo (25%) y similitud básica de palabras (20%); persiste scores >=50 y no equivale a reconocimiento visual. Gemini Vision se invoca por endpoints separados para describir o comparar fotografías. Fotos locales se guardan en backend `uploads/`. El frontend llama a `/api/...`, guarda token en localStorage para web y SecureStore en móvil, y resuelve API URL con `EXPO_PUBLIC_API_URL`/host/fallback Render.

Antes de editar cualquier código Expo, consulta la documentación versionada exacta https://docs.expo.dev/versions/v57.0.0/. No leas ni reproduzcas `.env` o secretos; hay credenciales/configuración sensibles embebidas en archivos y deben tratarse como comprometidas. Consulta `CONTEXTO_PROYECTO_IA.md` para árbol de archivos, responsabilidades, rutas API, reglas de matching, despliegue y riesgos observados. Distingue lo comprobado en código de lo descrito solo en README y valida compatibilidad/seguridad antes de proponer cambios.
```
