import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import Base, engine
import app.models
from app.api import auth, me, alertas, avistamientos, matches, vision

# Auto-crear tablas en la base de datos si no existen
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Advertencia: No se pudieron sincronizar las tablas al inicio: {e}")

app = FastAPI(
    title="PetMatch API 🐾",
    description="Backend oficial de PetMatch para rescate y búsqueda de mascotas perdidas. Compatible con Expo (React Native) y Web.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuración de CORS amplia para desarrollo móvil y web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import FileResponse, RedirectResponse

DEFAULT_PET_FALLBACK_URL = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop"

# Asegurar que el directorio de subidas exista
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@app.get("/uploads/{filename:path}", tags=["Archivos"])
async def serve_upload_file(filename: str):
    clean_filename = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, clean_filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return RedirectResponse(DEFAULT_PET_FALLBACK_URL, status_code=307)

# Incluir routers de la API
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(me.router, prefix="/api/me", tags=["Usuario"])
app.include_router(alertas.router, prefix="/api/alertas", tags=["Alertas de Pérdida"])
app.include_router(avistamientos.router, prefix="/api/avistamientos", tags=["Avistamientos"])
app.include_router(matches.router, prefix="/api/matches", tags=["Matches"])
app.include_router(vision.router, prefix="/api/ia", tags=["Inteligencia Artificial"])


@app.get("/", tags=["General"])
def read_root():
    return {
        "app": "PetMatch API",
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0"
    }
