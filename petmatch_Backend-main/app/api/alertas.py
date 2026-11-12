from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.forms import alerta_create_form
from app.core.database import get_db
from app.schemas.alerta import (
    AlertaCreateForm,
    AlertaCreateResponse,
    AlertaResolverBody,
    AlertaResponse,
    AlertasListResponse,
)
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
def marcar_alerta_resuelta(
    alerta_id: str,
    body: AlertaResolverBody,
    db: Session = Depends(get_db),
):
    """Cierra la alerta con el código entregado al publicar. No requiere cuenta."""
    alerta = alertas_service.obtener_alerta(db, alerta_id)
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    if not alerta.activa:
        return {
            "success": True,
            "mensaje": "Esta alerta ya estaba marcada como reencontrada.",
            "alerta": alerta,
        }
    if not alerta.codigoCierreHash:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta alerta se publicó antes de los códigos de cierre y no se puede cerrar desde la app.",
        )
    if not alertas_service.verificar_codigo_cierre(alerta, body.codigoCierre):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Código de cierre incorrecto. Es el que te dimos al publicar la alerta.",
        )
    return {
        "success": True,
        "mensaje": "¡Mascota marcada como reencontrada!",
        "alerta": alertas_service.marcar_resuelta(db, alerta),
    }


@router.post("", response_model=AlertaCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_alerta(
    datos: AlertaCreateForm = Depends(alerta_create_form),
    foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Crea una alerta comunitaria. El código de cierre se entrega solo en esta respuesta."""
    alerta, codigo_cierre = alertas_service.crear_alerta(db, datos, foto)
    return {"success": True, "alerta": alerta, "codigoCierre": codigo_cierre}
