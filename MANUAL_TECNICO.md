# Manual técnico — PetMatch

Este documento alcanza para clonar el repositorio en **cualquier PC (Windows, macOS o Linux)**, levantar el sistema y comprobar que funciona. Está pensado para la comisión: no hace falta cuenta de Neon, ni de Render, ni de Apple, ni Android Studio.

Repositorio: https://github.com/Matizzzi/PetMatch_final

---

## 1. Qué es y cómo está armado

PetMatch es una plataforma comunitaria para reportar mascotas perdidas y avistamientos **sin registro**. Quien publica una alerta recibe un código de 8 caracteres para marcarla como resuelta.

| Pieza | Tecnología | Puerto |
|---|---|---|
| App web | Expo / React Native Web + Nginx | **3000** |
| API | FastAPI (Python) + Uvicorn | **8000** |
| Base de datos | PostgreSQL 15 (Docker) | **5432** |
| Visor SQL | pgAdmin 4 | **5050** |

Todo corre con **Docker Compose**. El front habla con el back a través de Nginx (`/api` → FastAPI). Las fotos se comprimen a JPEG y se guardan en la base (Data URL). El matching es heurístico (especie, zona, tiempo, texto). La IA de fotos es **opcional** (Groq/Gemini); si no hay claves, se usa un análisis local con Pillow.

No hay login. No hay JWT.

---

## 2. Requisitos (una sola vez)

1. **Git** — https://git-scm.com/downloads  
2. **Docker Desktop** — https://www.docker.com/products/docker-desktop/  
   - Windows: activá WSL 2 si el instalador lo pide.  
   - Mac: Docker Desktop para Apple Silicon o Intel, según la máquina.  
3. Dejá Docker Desktop **abierto** (ícono estable, no “Starting…”).  
4. Puertos libres: `3000`, `8000`, `5050`, `5432`.  
   Si `5432` está ocupado (otro Postgres), cerralo o pará ese servicio.

**No hace falta** instalar Node, Python ni Postgres en el host. Van dentro de los contenedores.

RAM recomendada para Docker: 6 GB o más. La primera descarga de imágenes puede pesar ~2 GB.

---

## 3. Clonar

```bash
git clone https://github.com/Matizzzi/PetMatch_final.git
cd PetMatch_final
```

---

## 4. Arrancar (el camino que debe usar la comisión)

### Windows

1. Abrí **Docker Desktop** y esperá a que esté en verde.  
2. Doble clic en `iniciar.bat`.  
3. La primera vez tarda **5 a 15 minutos**. Las siguientes, menos de 2 minutos.  
4. Cuando termine, se abre el navegador en http://localhost:3000  

Si no se abre solo, entrá a esa URL a mano.

### macOS / Linux

En la carpeta del proyecto:

```bash
chmod +x iniciar.sh
./iniciar.sh
```

O, en cualquier sistema, desde la carpeta del repo:

```bash
cp .env.example .env
docker compose up -d --build
```

Esperá a que `docker compose ps` muestre `petmatch_backend` **healthy** y `petmatch_frontend` **Up**.

### Cómo saber que está bien

| URL | Qué deberías ver |
|---|---|
| http://localhost:3000 | Home de PetMatch (alertas / matches) |
| http://localhost:8000 | JSON `{"app":"PetMatch API","status":"online",...}` |
| http://localhost:8000/docs | Swagger de la API |
| http://localhost:5050 | Login de pgAdmin |

pgAdmin:

- Email: `admin@petmatch.com`  
- Password: `admin`  

Si pide *master password*, tocá **Reset Master Password** y usá `admin`.  
Servidor **PetMatch (Postgres local)**: usuario `petmatch_user`, contraseña `petmatch_password`.  
Clic derecho en una tabla → **View/Edit Data → All Rows**.

Para parar: doble clic en `detener.bat`, o `docker compose down`. Los datos locales se conservan.

---

## 5. Prueba mínima (5 minutos)

En http://localhost:3000:

1. **Perdí mi mascota**: nombre, especie perro o gato, foto, ubicación, publicar.  
   Guardá el **código de cierre** que muestra la app (8 caracteres).  
2. **Vi una mascota**: misma especie, foto, zona cercana, publicar.  
3. Home → **Matches**: debería aparecer una coincidencia (el umbral es 48).  
4. Opcional: **Analizar con IA**.  
   - Sin `GROQ_API_KEY` en `.env`: análisis local (pelaje por color).  
   - Con Groq: raza/pelaje/triaje. Un dibujo o una persona debe responder “Foto no apta”.

Si esos cuatro puntos responden, el sistema está operativo para la comisión.

---

## 6. Archivo `.env`

`iniciar.bat` / `iniciar.sh` copian `.env.example` → `.env` si no existe.

Valores por defecto (ya listos):

```
DATABASE_URL=postgresql://petmatch_user:petmatch_password@postgres:5432/petmatch
BASE_URL=http://localhost:8000
GROQ_API_KEY=
GEMINI_API_KEY=
```

- **No subas `.env` a GitHub.**  
- `GROQ_API_KEY` es opcional. La app no se rompe si está vacío.  
- El host `postgres` solo existe **dentro** de Docker. No lo uses desde psql del Windows salvo que cambies el host a `localhost`.

### Usar Neon (opcional, no hace falta para la comisión)

Reemplazá `DATABASE_URL` por la connection string del dashboard de Neon (`sslmode=require`). El contenedor Postgres local igual arranca, pero la API hablará con Neon.

---

## 7. Si algo falla

| Síntoma | Qué hacer |
|---|---|
| `docker compose` no existe | Docker Desktop no está instalado o no está abierto |
| Puerto ocupado | `docker compose down` y cerrá el otro programa (XAMPP, otro Postgres, etc.) |
| `localhost:3000` en blanco o 502 | Esperá a que el backend esté healthy: `docker compose ps` y `docker compose logs backend` |
| App carga pero no hay datos | Es normal en una PC nueva: la base local empieza vacía. Publicá una alerta de prueba |
| pgAdmin `ERR_CONNECTION_REFUSED` | `docker compose up -d --force-recreate pgadmin` y abrí http://localhost:5050 |
| IA no analiza / error 429 | Cupo de Groq o límite de la API (8 cada 10 min, 25 al día). Completá el formulario a mano |
| Primera build se cuelga | Revisá que Docker tenga disco y RAM; `docker compose down` y `docker compose up -d --build` |
| Windows: scripts bloqueados | Ejecutá `iniciar.bat` con doble clic, no hace falta PowerShell |

Logs:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

Reconstrucción limpia (no borra el volumen de Postgres):

```bash
docker compose down
docker compose up -d --build
```

Borrar también la base local (empezar de cero):

```bash
docker compose down -v
```

---

## 8. Cómo está organizado el código

```
PetMatch_final/
  docker-compose.yml          Orquesta front, API, Postgres y pgAdmin
  .env.example                Plantilla sin secretos
  iniciar.bat / iniciar.sh    Arranque
  detener.bat
  petmatch_Front-main/        Expo SDK 57 (web, Android, iOS via Expo Go)
  petmatch_Backend-main/      FastAPI
  pgadmin/servers.json        Servidores precargados en pgAdmin
```

API útil:

- `POST /api/alertas` — publica pérdida (devuelve `codigoCierre` una sola vez)  
- `PATCH /api/alertas/{id}/resolver` — cierra con el código  
- `POST /api/avistamientos`  
- `GET /api/matches`  
- `POST /api/ia/analizar` — visión (opcional)

Tablas: `usuarios`, `mascotas`, `alertas_perdida`, `reportes_avistamiento`, `matches`.

---

## 9. App en el celular (opcional, no requerido para la comisión)

La comisión puede evaluar todo en el navegador (`localhost:3000`).

- **Android APK**: se genera con EAS desde `petmatch_Front-main` (hace falta cuenta Expo). El APK de producción apunta a `https://petmatch-backend-japt.onrender.com`.  
- **iPhone**: el mismo código corre en **Expo Go** (gratis). No hay IPA sin cuenta Apple Developer paga.  
- En la red local, la API tiene que ser la IP de la PC, no `localhost` (el teléfono no ve el localhost del notebook).

---

## 10. Producción (referencia, no hace falta el día de la defensa)

- API: Render (`petmatch-backend`, Docker).  
- Datos: Neon (Postgres). En local, Docker Postgres reemplaza a Neon.  
- Front web de demo: contenedor Nginx en el puerto 3000.  
- Las claves (`DATABASE_URL`, `GROQ_API_KEY`) viven en el `.env` local o en el dashboard de Render, nunca en el repo.
