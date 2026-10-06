# PetMatch Backend (FastAPI + Neon PostgreSQL + Docker) 🐾

Backend oficial para la plataforma **PetMatch**. Provee APIs REST para la aplicación móvil en **Expo (React Native)** y el cliente web.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Matizzzi/petmatch_Backend)

---

## 🚀 Cómo ejecutar el proyecto

### Opción 1: Con Docker (Recomendado para producción o despliegue)

Asegúrate de tener Docker instalado y ejecuta en la carpeta `backend/`:

```bash
docker compose up --build
```

La API estará disponible en `http://localhost:8000`.

---

### Opción 2: Localmente con Python

1. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Iniciar el servidor en modo desarrollo con auto-reload:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

---

## 📖 Documentación Interactiva de la API (Swagger UI)

Una vez iniciado el servidor, abre en tu navegador:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

Desde Swagger puedes probar interactivamente todos los endpoints, autenticarte y revisar los esquemas de datos.

---

## 🔌 Endpoints Principales

- `POST /api/auth`: Login / Registro unificado con JWT.
- `GET /api/me`: Consulta de perfil del usuario logueado (requiere Bearer Token).
- `GET /api/alertas`: Listado de mascotas perdidas activas con sus datos y fotos.
- `POST /api/alertas`: Publicación de una nueva alerta de mascota perdida con soporte para foto y geolocalización (requiere autenticación).
- `GET /api/avistamientos`: Listado comunitario de avistamientos recientes.
- `POST /api/avistamientos`: Reporte comunitario rápido de un animal visto en la calle (foto obligatoria).
- `/uploads/{archivo}`: Servidor de archivos estáticos para las imágenes subidas.
