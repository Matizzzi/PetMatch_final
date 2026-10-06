"""Casos de uso de reportes de avistamiento comunitarios."""
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.database import generate_id
from app.models.avistamiento import ReporteAvistamiento
from app.schemas.avistamiento import AvistamientoCreateForm
from app.services.image_loader import DEFAULT_SAMPLE_IMAGE
from app.services.image_storage import procesar_y_optimizar_foto
from app.services.matching import procesar_matches_para_avistamiento
from app.services.text_utils import limpiar_opcional

logger = logging.getLogger(__name__)

LIMITE_LISTADO = 50


def listar_recientes(db: Session) -> List[ReporteAvistamiento]:
    return (
        db.query(ReporteAvistamiento)
        .order_by(ReporteAvistamiento.createdAt.desc())
        .limit(LIMITE_LISTADO)
        .all()
    )


def obtener_avistamiento(db: Session, avistamiento_id: str) -> Optional[ReporteAvistamiento]:
    return db.query(ReporteAvistamiento).filter(ReporteAvistamiento.id == avistamiento_id).first()


def crear_avistamiento(
    db: Session, datos: AvistamientoCreateForm, foto: Optional[UploadFile]
) -> ReporteAvistamiento:
    """Persiste el reporte y lo cruza de inmediato con las alertas activas."""
    foto_url = (
        procesar_y_optimizar_foto(foto=foto, foto_url=datos.fotoUrl, prefijo="avistamiento")
        or DEFAULT_SAMPLE_IMAGE
    )

    reporte = ReporteAvistamiento(
        id=generate_id("avist"),
        especie=datos.especie.strip(),
        descripcion=datos.descripcion.strip(),
        fotoUrl=foto_url,
        latitud=datos.latitud,
        longitud=datos.longitud,
        comuna=limpiar_opcional(datos.comuna),
        contactoNombre=limpiar_opcional(datos.contactoNombre),
        contactoTelefono=limpiar_opcional(datos.contactoTelefono),
        contactoEmail=limpiar_opcional(datos.contactoEmail),
        fechaAvistamiento=datetime.now(timezone.utc),
        procesado=False,
    )
    db.add(reporte)
    db.commit()
    db.refresh(reporte)

    try:
        procesar_matches_para_avistamiento(db, reporte)
    except Exception as e:
        logger.warning(f"Aviso al procesar matches para avistamiento {reporte.id}: {e}")

    return reporte


def actualizar_foto(
    db: Session, reporte: ReporteAvistamiento, foto: Optional[UploadFile], foto_url: Optional[str]
) -> str:
    nueva = procesar_y_optimizar_foto(foto=foto, foto_url=foto_url, prefijo="avistamiento")
    if nueva:
        reporte.fotoUrl = nueva
        db.commit()
        db.refresh(reporte)
    return reporte.fotoUrl
