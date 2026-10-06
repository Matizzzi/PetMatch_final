# 🐾 PetMatch — Plataforma de Rescate y Búsqueda de Mascotas Perdidas

> **Proyecto de Título de Ingeniería de Software**  
> Plataforma comunitaria integral para reporte, rescate y encuentro de mascotas perdidas mediante geolocalización, matching heurístico multivariable e Inteligencia Artificial Multimodal (Google Gemini Vision).

---

## 🚀 Inicio Rápido en Cualquier PC (100% Docker)

El proyecto está diseñado para funcionar en **cualquier computadora** (Windows, macOS, Linux) teniendo instalado únicamente **Docker Desktop**. No requiere instalar Node.js, Python ni PostgreSQL en la máquina host.

### Opción A: En Windows (Doble Clic)
Simplemente haz doble clic en el archivo **`iniciar.bat`**.  
Este script compilará e iniciará todos los contenedores y abrirá la aplicación web en tu navegador automáticamente. Para detenerlo, ejecuta **`detener.bat`**.

### Opción B: En Terminal (Windows PowerShell / macOS / Linux)
Ejecuta en la raíz de esta carpeta:
```bash
docker compose up -d --build
```

> **Nota:** El archivo `.env` ya viene preconfigurado con la base de datos en la nube (Neon PostgreSQL). Además, el archivo `docker-compose.yml` cuenta con valores por defecto automáticos, por lo que **funcionará directamente sin necesidad de configuración manual**.

---

## 🌐 Enlaces de Acceso Local

Una vez iniciado Docker, los servicios estarán disponibles en:

| Servicio | URL | Credenciales / Detalles |
| :--- | :--- | :--- |
| **Frontend Web** | [http://localhost:3000](http://localhost:3000) | Aplicación Expo React Native Web servida por Nginx |
| **Backend REST API** | [http://localhost:8000](http://localhost:8000) | FastAPI + Uvicorn |
| **Documentación Swagger** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interfaz OpenAPI para probar todos los endpoints |
| **Documentación ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Especificación técnica de la API |
| **pgAdmin 4 (Opcional)** | [http://localhost:5050](http://localhost:5050) | Email: `admin@petmatch.com` \| Clave: `admin` |

---

## 🏗️ Arquitectura del Sistema

```text
[ Cliente Web / Móvil ]
      │
      ▼ (Puerto 3000)
┌───────────────────────────────────────────────┐
│              petmatch_frontend                │
│    Expo React Native Web 57 + Nginx 1.25     │
│  - SPA Routing                                │
│  - Reverse proxy /api/ y /uploads/ hacia API  │
└───────────────────────┬───────────────────────┘
                        │
                        ▼ (Puerto 8000)
┌───────────────────────────────────────────────┐
│               petmatch_backend                │
│            FastAPI + Python 3.11              │
│  - Autenticación JWT / Sesión Comunitaria     │
│  - Heurística de Coincidencia (55% D, 25% T, 20% P)
│  - Visión Computacional Multimodal (Gemini)   │
│  - Subida y almacenamiento de fotos /uploads  │
└───────────────────────┬───────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
┌────────────────────────┐    ┌────────────────────────┐
│  Neon Cloud PostgreSQL │    │  Postgres Local Alpine │
│  (Base por defecto)    │    │  (Modo offline local)  │
│  Serverless + SSL      │    │  `--profile local-db`  │
└────────────────────────┘    └────────────────────────┘
```

---

## 🛠️ Comandos de Mantenimiento

- **Ver el estado de los contenedores:**
  ```bash
  docker compose ps
  ```
- **Ver los logs en tiempo real:**
  ```bash
  docker compose logs -f
  ```
- **Detener los servicios:**
  ```bash
  docker compose down
  ```
- **Reiniciar todos los servicios:**
  ```bash
  docker compose restart
  ```
- **Modo 100% Offline (Base de datos local en Docker):**
  ```bash
  docker compose --profile local-db up -d
  ```

---

## 🐾 Funcionalidades Principales

1. **Exploración Georreferenciada**: Mapa interactivo con marcadores diferenciados de mascotas perdidas y avistamientos de animales callejeros (foco inicial: Melipilla, Chile).
2. **Reporte de Pérdida con IA**: Generación de alertas con carga de fotos, señas particulares y análisis morfológico automático mediante Gemini Vision.
3. **Reportes Comunitarios de Avistamientos**: Reporte rápido por testigos con geolocalización y contacto WhatsApp directo.
4. **Algoritmo de Matching Heurístico**:
   - Validación estricta de especie (perro/gato).
   - Distancia geográfica (Haversine, 55% de ponderación).
   - Cercanía temporal (25% de ponderación).
   - Coincidencia léxica de rasgos y pelaje (20% de ponderación).
   - Generación automática de posibles coincidencias (`score >= 50%`).
5. **Peritaje Biométrico Forense**: Comparación fotográfica lado a lado de mascota perdida vs. animal avistado con IA, discriminando suciedad o desgaste por calle vs. rasgos óseos y manchas invariables.
6. **Generador de Afiches de Búsqueda**: Creación instantánea de afiche con datos y foto para compartir en redes sociales y WhatsApp.
