import os
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse

from app.api import alertas, avistamientos, matches, vision
from app.core.config import settings
from app.core.database import Base, SessionLocal, asegurar_esquema, engine
import app.models  # noqa: F401  — registra las tablas en Base.metadata

def _recalcular_matches_en_segundo_plano() -> None:
    """Reaplica el umbral al arrancar, sin bloquear el puerto (evita 502 de Nginx)."""

    def _run() -> None:
        from app.services.matches_service import recalcular_todos

        db = SessionLocal()
        try:
            resultado = recalcular_todos(db)
            print(f"Matches recalculados al inicio: {resultado}")
        except Exception as e:
            print(f"Advertencia: no se pudieron recalcular matches: {e}")
        finally:
            db.close()

    threading.Thread(target=_run, daemon=True, name="recalc-matches").start()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    try:
        Base.metadata.create_all(bind=engine)
        asegurar_esquema()
    except Exception as e:
        print(f"Advertencia: No se pudieron sincronizar las tablas al inicio: {e}")
    _recalcular_matches_en_segundo_plano()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "API REST de PetMatch: alertas de mascotas perdidas, avistamientos comunitarios, "
        "matching heurístico y análisis de fotografías."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alertas.router, prefix="/api/alertas", tags=["Alertas de Pérdida"])
app.include_router(avistamientos.router, prefix="/api/avistamientos", tags=["Avistamientos"])
app.include_router(matches.router, prefix="/api/matches", tags=["Matches"])
app.include_router(vision.router, prefix="/api/ia", tags=["Inteligencia Artificial"])


@app.get("/uploads/{filename:path}", tags=["Archivos"])
async def serve_upload_file(filename: str):
    clean_filename = os.path.basename(filename)
    file_path = os.path.join(settings.UPLOAD_DIR, clean_filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return RedirectResponse(settings.IMAGE_FALLBACK_URL, status_code=307)


@app.get("/", tags=["General"])
def read_root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "version": settings.APP_VERSION,
    }
