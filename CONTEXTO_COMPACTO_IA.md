# 🐾 PetMatch — Contexto Técnico de Alta Densidad (Optimizado para Tokens)

> **Uso recomendado**: Copia y pega este documento (o el "Prompt de Inicio Rápido" al final) en cualquier conversación nueva con ChatGPT, Claude, DeepSeek o Gemini. Ocupa menos de 1.200 tokens y le da al modelo el 100% de la arquitectura y contratos del proyecto sin gastar cuota innecesaria.

---

### 1. Resumen y Stack del Proyecto
- **Nombre**: PetMatch (Proyecto de Título - Ingeniería de Software, Melipilla, Chile).
- **Frontend**: Expo SDK 57 (`expo-router`, React Native 0.86, React 19.2, TypeScript, Tailwind/global.css, Nginx en contenedor web).
- **Backend**: FastAPI (Python 3.11, Uvicorn, SQLAlchemy 2.0, Pydantic v2, JWT/bcrypt).
- **Base de Datos**: PostgreSQL en la nube (Neon Serverless) con soporte offline (`postgres:15-alpine` con perfil `local-db`).
- **DevOps**: Docker Compose multi-contenedor (`frontend:3000`, `backend:8000`, `pgadmin:5050`).
- **IA**: Google Gemini Vision Multimodal (`gemini-2.0-flash`, `gemini-1.5-flash`) para extracción morfológica y comparación biométrica forense.

---

### 2. Esquema de Datos (Relaciones Principales)
```text
Usuario (1) ── (N) Mascota (1) ── (N) AlertaPerdida (1) ── (N) Match (N) ── (1) ReporteAvistamiento
```
- **`Usuario`**: `id` (`usr_*`), `email` (unique), `password` (bcrypt), `nombre`, `telefono`.
- **`Mascota`**: `id` (`masc_*`), `nombre`, `especie` (perro/gato/otro), `descripcion`, `fotoUrl`, `usaCollar` (bool), `descripcionCollar`, `tieneChip` (bool), `condicionMedica`, `usuarioId`.
- **`AlertaPerdida`**: `id` (`alt_*`), `mascotaId`, `usuarioId`, `latitud`, `longitud`, `fechaPerdida`, `sector`, `urgente` (bool), `activa` (bool), `whatsapp`, `createdAt`.
- **`ReporteAvistamiento`**: `id` (`avist_*`), `especie`, `descripcion`, `fotoUrl`, `latitud`, `longitud`, `fechaAvistamiento`, `contactoNombre`, `contactoTelefono`, `procesado` (bool).
- **`Match`**: `id` (`match_*`), `alertaPerdidaId`, `reporteAvistamientoId`, `scoreDistancia` (0-100), `scoreTiempo` (0-100), `scoreTexto` (0-100), `scoreTotal` (0-100, umbral >= 50), `notificado` (bool). Unique `(alertaPerdidaId, reporteAvistamientoId)`.

---

### 3. Lógica de Matching Heurístico (`matching.py`)
1. **Filtro canónico**: Comprueba equivalencia de especie (`perro`/`canino` vs `gato`/`felino`). Si difieren -> score 0.
2. **Ponderación**:
   $$\text{Score Total} = (0.55 \times \text{Distancia}) + (0.25 \times \text{Tiempo}) + (0.20 \times \text{Texto})$$
3. **Escalas**:
   - **Distancia (Haversine)**: \(\le 0.5\text{km}=100\), \(\le 1\text{km}=92\), \(\le 2.5\text{km}=80\), \(\le 5\text{km}=65\), \(\le 10\text{km}=40\), \(\le 20\text{km}=20\), \(>20\text{km}=0\).
   - **Tiempo**: \(\le 24\text{h}=100\), \(\le 3\text{d}=85\), \(\le 7\text{d}=70\), \(\le 14\text{d}=50\), \(\le 30\text{d}=30\), \(>30\text{d}=10\).
   - **Texto**: Tokenización, eliminación de stopwords y cálculo de intersección de palabras clave descriptivas (color, tamaño, rasgos).
4. **Disparadores**: Se ejecuta automáticamente al crear una alerta contra los 50 avistamientos más recientes, y al crear un avistamiento contra todas las alertas activas.

---

### 4. API Endpoints
- `GET /` -> Estado del servidor.
- `POST /api/auth` -> Login o Registro unificado (retorna JWT y datos de usuario).
- `GET /api/me` -> Perfil autenticado (Bearer Token).
- `GET /api/alertas` -> Listado ordenado por urgencia y fecha (`?incluir_resueltas=bool`).
- `POST /api/alertas` -> Multipart: datos de mascota + alerta + foto opcional (asigna usuario invitado si no hay token).
- `PATCH /api/alertas/{id}/resolver` -> Marca alerta como resuelta (`activa = false`).
- `GET /api/avistamientos` -> Últimos 50 avistamientos.
- `POST /api/avistamientos` -> Multipart: avistamiento con foto + coordenadas + cálculo inmediato de matches.
- `GET /api/matches` -> Listado de matches filtrables por `alertaId` y `minScore`.
- `GET /api/matches/alerta/{id}` -> Matches específicos de una mascota.
- `POST /api/matches/recalcular-todos` -> Recalcula matches pendientes.
- `POST /api/ia/analizar` -> Analiza foto con Gemini Vision y devuelve JSON estructurado (especie, raza probable, pelaje, tamaño, señas particulares).
- `POST /api/ia/comparar-forense` -> Recibe dos URLs/fotos y genera informe biométrico forense discriminando factores de calle vs rasgos permanentes.
- `GET /uploads/{archivo}` -> Servidor de imágenes estáticas locales.

---

### 5. Configuración de Entornos y Puertos
- **Host Ports**:
  - `3000`: Frontend Expo Web servido vía Nginx con reverse proxy `/api` y `/uploads` hacia `:8000`.
  - `8000`: Backend FastAPI + Swagger docs en `/docs`.
  - `5050`: pgAdmin 4 (`admin@petmatch.com` / `admin`).
- **Variables Críticas (`.env`)**:
  - `DATABASE_URL`: URI de conexión a Neon PostgreSQL.
  - `JWT_SECRET`: Clave simétrica HS256.
  - `BASE_URL`: URL base del backend para resolver rutas de imágenes `/uploads`.
  - `EXPO_PUBLIC_API_URL`: URL de la API consumida por el frontend (`http://localhost:8000` o Render).
  - `GEMINI_API_KEY`: Clave para endpoints de visión multimodal.

---

### 6. Prompt de Inicio Rápido (Copiar y Pegar en Nuevos Chats)
```text
Actúa como Arquitecto de Software y Desarrollador Full-Stack para el proyecto "PetMatch", una plataforma comunitaria de rescate de mascotas (Melipilla, Chile). El stack es:
- Frontend: Expo SDK 57 (Expo Router, React Native Web, TypeScript) servido en Nginx (puerto 3000).
- Backend: FastAPI (Python 3.11, Uvicorn, SQLAlchemy 2.0, Pydantic v2) en puerto 8000.
- Base de Datos: Neon Serverless PostgreSQL + pgAdmin en puerto 5050.
- DevOps: Docker Compose que orquesta los 3 servicios.
- Lógica de Negocio: Matching heurístico multivariable (55% distancia Haversine, 25% tiempo, 20% texto) y Gemini Vision para peritaje pericial biométrico y extracción morfológica.
- Modelos: Usuario, Mascota, AlertaPerdida, ReporteAvistamiento, Match.
Responde de forma concisa, técnica y directamente orientada a código sin explicaciones redundantes.
```
