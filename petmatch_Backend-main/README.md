# PetMatch Backend

FastAPI + PostgreSQL (Neon). Sirve a la app Expo y al cliente web.

## Estructura

```
app/
  main.py          Punto de entrada: CORS, routers, /uploads, health
  api/             Rutas HTTP (un archivo por recurso)
  core/            Settings, DB, rate limit  ← nada de negocio acá
  models/          Tablas SQLAlchemy
  schemas/         Contratos Pydantic (request/response)
  services/        Casos de uso (alertas, matching, visión, fotos)
  prompts/         Textos de Groq/Gemini (separados de los clientes HTTP)
uploads/           Copias locales de fotos (el origen de verdad va en Neon)
```

Valores que cambian por entorno (umbral de match, modelos de IA, CORS, claves)
están en `app/core/config.py` y se pisan con `.env`. No hardcodear en los routers.

## Cómo correrlo

**Con el stack del repo** (recomendado): `docker compose up` en `PetMatch_final/`.

**Solo este API:**

```bash
docker compose up --build
```

O en local:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| GET/POST | `/api/alertas` | Pérdidas. El cierre es anónimo con `codigoCierre` |
| GET/POST | `/api/avistamientos` | Reportes de calle |
| GET | `/api/matches` | Coincidencias heurísticas |
| POST | `/api/ia/analizar` | Visión (Groq → Gemini → local) |
| POST | `/api/ia/comparar-forense` | Comparación de dos fotos |
