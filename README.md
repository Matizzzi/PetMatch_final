# PetMatch

Plataforma comunitaria para mascotas perdidas (Melipilla). Sin registro: se publica anónimo y se cierra con un código de 8 caracteres.

```
petmatch_Front-main/     App Expo (web + Android)
petmatch_Backend-main/   API FastAPI
pgadmin/                 Solo para Docker (opcional)
```

## Arrancar

Copia `.env.example` a `.env` y poné `DATABASE_URL` (y `GROQ_API_KEY` si usás IA). Nunca subas el `.env`.

Windows: doble clic en `iniciar.bat`. Para parar: `detener.bat`.

O en terminal:

```bash
docker compose up -d --build
```

| Qué | URL |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:8000 |
| Docs | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 (admin@petmatch.com / admin) |

## Qué hace

- Publicar pérdida o avistamiento con foto
- Matching por especie, zona, tiempo y rasgos
- Peritaje de fotos (Groq → Gemini → local)
- Afiche para WhatsApp
