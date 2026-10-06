from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.forms import avistamiento_create_form
from app.core.database import get_db
from app.schemas.avistamiento import (
    AvistamientoCreateForm,
    AvistamientoCreateResponse,
    AvistamientosListResponse,
)
from app.services import avistamientos_service

router = APIRouter()


@router.get("", response_model=AvistamientosListResponse)
def list_avistamientos(db: Session = Depends(get_db)):
    """Lista los últimos 50 avistamientos registrados."""
    return {"avistamientos": avistamientos_service.listar_recientes(db)}


@router.post("", response_model=AvistamientoCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_avistamiento(
    datos: AvistamientoCreateForm = Depends(avistamiento_create_form),
    foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Crea un nuevo reporte de avistamiento comunitario y calcula matches inmediatos."""
    return {"success": True, "reporte": avistamientos_service.crear_avistamiento(db, datos, foto)}


@router.patch("/{avistamiento_id}/foto")
async def actualizar_foto_avistamiento(
    avistamiento_id: str,
    foto: Optional[UploadFile] = File(None),
    fotoUrl: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Actualiza la foto de un avistamiento y la persiste en Neon PostgreSQL."""
    reporte = avistamientos_service.obtener_avistamiento(db, avistamiento_id)
    if not reporte:
        raise HTTPException(status_code=404, detail="Avistamiento no encontrado")
    return {
        "success": True,
        "mensaje": "Foto de avistamiento actualizada y guardada en Neon PostgreSQL",
        "fotoUrl": avistamientos_service.actualizar_foto(db, reporte, foto, fotoUrl),
    }
