from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_optional_current_user
from app.api.forms import alerta_create_form
from app.core.database import get_db
from app.models.usuario import Usuario
from app.schemas.alerta import AlertaCreateForm, AlertaCreateResponse, AlertaResponse, AlertasListResponse
from app.services import alertas_service

router = APIRouter()


@router.get("", response_model=AlertasListResponse)
def list_alertas(incluir_resueltas: bool = True, db: Session = Depends(get_db)):
    """Lista todas las alertas ordenadas por estado activo, urgencia y fecha."""
    return {"alertas": alertas_service.listar_alertas(db, incluir_resueltas)}


@router.get("/{alerta_id}", response_model=AlertaResponse)
def get_alerta(alerta_id: str, db: Session = Depends(get_db)):
    """Detalle público de una alerta (destino del código QR del afiche)."""
    alerta = alertas_service.obtener_alerta(db, alerta_id)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return alerta


@router.patch("/{alerta_id}/resolver")
def marcar_alerta_resuelta(alerta_id: str, db: Session = Depends(get_db)):
    """Marca una alerta de mascota como resuelta / reencontrada con su familia."""
    alerta = alertas_service.obtener_alerta(db, alerta_id)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return {
        "success": True,
        "mensaje": "¡Mascota marcada como reencontrada!",
        "alerta": alertas_service.marcar_resuelta(db, alerta),
    }


@router.post("", response_model=AlertaCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_alerta(
    datos: AlertaCreateForm = Depends(alerta_create_form),
    foto: Optional[UploadFile] = File(None),
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Crea una nueva alerta de mascota perdida (con o sin usuario registrado)."""
    alerta = alertas_service.crear_alerta(db, datos, foto, current_user)
    return {"success": True, "alerta": alerta}


@router.patch("/{alerta_id}/foto")
async def actualizar_foto_alerta(
    alerta_id: str,
    foto: Optional[UploadFile] = File(None),
    fotoUrl: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Actualiza la foto de una mascota perdida y la persiste en Neon PostgreSQL."""
    alerta = alertas_service.obtener_alerta(db, alerta_id)
    if not alerta or not alerta.mascota:
        raise HTTPException(status_code=404, detail="Alerta o mascota no encontrada")
    return {
        "success": True,
        "mensaje": "Foto de mascota actualizada y guardada en Neon PostgreSQL",
        "fotoUrl": alertas_service.actualizar_foto(db, alerta, foto, fotoUrl),
    }
