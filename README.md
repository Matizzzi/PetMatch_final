# PetMatch

Plataforma comunitaria para mascotas perdidas. **Sin registro**: se publica anónimo y se cierra con un código de 8 caracteres.

**Si vas a evaluarlo o instalarlo: leé [`MANUAL_TECNICO.md`](MANUAL_TECNICO.md).** Ahí está el paso a paso para cualquier PC (Windows, macOS, Linux), puertos, prueba mínima y qué hacer si algo falla.

## Arranque rápido

1. Instalá [Docker Desktop](https://www.docker.com/products/docker-desktop/) y dejaló abierto.
2. Cloná este repo.
3. Windows: doble clic en `iniciar.bat`.  
   macOS/Linux: `chmod +x iniciar.sh && ./iniciar.sh`

| Qué | URL |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:8000 |
| Docs | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 (`admin@petmatch.com` / `admin`) |

La primera vez tarda varios minutos (build). Postgres corre en Docker; no hace falta cuenta Neon para la demo local. `GROQ_API_KEY` es opcional.

Nunca subas el archivo `.env`.

```
petmatch_Front-main/     Expo (web + Android + iOS / Expo Go)
petmatch_Backend-main/   FastAPI
pgadmin/                 Servidores de pgAdmin
```
