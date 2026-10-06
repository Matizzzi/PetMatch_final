# 🐾 PetMatch — Plataforma Completa (Docker, Frontend, Backend & Neon DB)

Bienvenido a **PetMatch**, la solución integral para el reporte, rescate y encuentro de mascotas perdidas. Este repositorio unifica el **Frontend (Expo React Native Web)** y el **Backend (FastAPI + Python)** con persistencia en **Neon Serverless PostgreSQL** y soporte de despliegue en **Render** y **Docker**.

---

## 🚀 Inicio Rápido con Docker (Para Cualquier PC)

Solo necesitas tener instalado **Docker** y **Docker Compose**.

### 1. Clonar y configurar variables de entorno
```bash
# Copia el archivo de variables de entorno si no lo tienes
cp .env.example .env
```

El archivo `.env` ya viene preconfigurado con la base de datos **Neon PostgreSQL** en la nube:
```env
DATABASE_URL="postgresql+psycopg2://neondb_owner:npg_VTEdG6hXmPH7@ep-crimson-butterfly-atp0naml-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="escribo-yoyo-una-frase-larga-random-solo-tuya-32-caracteres-oo-mas"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=43200
BASE_URL="http://localhost:8000"
PORT=8000
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### 2. Iniciar todos los servicios
Ejecuta el siguiente comando en la raíz del proyecto:
```bash
docker compose up -d --build
```

### 3. Acceder a las aplicaciones
- **Frontend Web**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Documentación Swagger Interactiva**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Documentación ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📦 Arquitectura de Contenedores

| Servicio | Contenedor | Puerto Host | Puerto Interno | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `petmatch_frontend` | `3000` | `80` | Expo Web servido con Nginx optimizado y reverse proxy a la API y subidas. |
| **Backend** | `petmatch_backend` | `8000` | `8000` | API FastAPI con recarga de código en caliente (volúmenes mapeados) y subida de archivos `/uploads`. |
| **Base de Datos** | *Neon Cloud DB* | N/A | `5432` | PostgreSQL Serverless en la nube con reconexión automática (`pool_pre_ping`). |
| **Postgres Local (Opcional)** | `petmatch_postgres` | `5432` | `5432` | Para uso 100% offline ejecutando `docker compose --profile local-db up`. |

---

## 🛠️ Comandos Útiles

- **Ver el estado de los contenedores:**
  ```bash
  docker compose ps
  ```
- **Ver los logs en tiempo real:**
  ```bash
  docker compose logs -f
  ```
- **Detener los contenedores:**
  ```bash
  docker compose down
  ```
- **Reiniciar servicios:**
  ```bash
  docker compose restart
  ```

---

## ☁️ Despliegue en Producción (Render & Vercel)

- **Backend en Render**: El archivo `render.yaml` en la raíz y en `petmatch_Backend-main/render.yaml` permite despliegue automático mediante Blueprint o Docker Web Service.
- **Frontend en Vercel / Render**: El frontend puede desplegarse en Vercel mediante `petmatch_Front-main/vercel.json` o mediante el contenedor Docker en Render.
