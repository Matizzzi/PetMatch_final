"""Casos de uso de alertas de mascotas perdidas."""
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session, joinedload

from app.core.database import generate_id
from app.models.alerta import AlertaPerdida
from app.models.mascota import Mascota
from app.models.usuario import Usuario
from app.schemas.alerta import AlertaCreateForm
from app.services.image_storage import procesar_y_optimizar_foto
from app.services.matching import procesar_matches_para_alerta
from app.services.text_utils import limpiar_opcional
from app.services.usuarios_service import get_or_create_guest_user

logger = logging.getLogger(__name__)


def listar_alertas(db: Session, incluir_resueltas: bool = True) -> List[AlertaPerdida]:
    """Alertas ordenadas por estado activo, urgencia y fecha de creación."""
    query = db.query(AlertaPerdida).options(joinedload(AlertaPerdida.mascota))
    if not incluir_resueltas:
        query = query.filter(AlertaPerdida.activa == True)  # noqa: E712 (SQLAlchemy)
    return query.order_by(
        AlertaPerdida.activa.desc(), AlertaPerdida.urgente.desc(), AlertaPerdida.createdAt.desc()
    ).all()


def obtener_alerta(db: Session, alerta_id: str) -> Optional[AlertaPerdida]:
    return (
        db.query(AlertaPerdida)
        .options(joinedload(AlertaPerdida.mascota))
        .filter(AlertaPerdida.id == alerta_id)
        .first()
    )


def marcar_resuelta(db: Session, alerta: AlertaPerdida) -> AlertaPerdida:
    alerta.activa = False
    db.commit()
    db.refresh(alerta)
    return alerta


def crear_alerta(
    db: Session,
    datos: AlertaCreateForm,
    foto: Optional[UploadFile],
    usuario: Optional[Usuario],
) -> AlertaPerdida:
    """Crea mascota + alerta en una transacción y calcula matches inmediatos."""
    usuario = usuario or get_or_create_guest_user(db)
    foto_url = procesar_y_optimizar_foto(foto=foto, foto_url=datos.fotoUrl, prefijo="mascota")

    mascota = Mascota(
        id=generate_id("masc"),
        nombre=datos.nombreMascota.strip(),
        especie=datos.especie.strip(),
        descripcion=datos.descripcion.strip(),
        fotoUrl=foto_url,
        usaCollar=datos.usaCollar,
        descripcionCollar=limpiar_opcional(datos.descripcionCollar) if datos.usaCollar else None,
        tieneChip=datos.tieneChip,
        condicionMedica=limpiar_opcional(datos.condicionMedica),
        usuarioId=usuario.id,
    )
    db.add(mascota)
    db.flush()

    alerta = AlertaPerdida(
        id=generate_id("alt"),
        mascotaId=mascota.id,
        usuarioId=usuario.id,
        latitud=datos.latitud,
        longitud=datos.longitud,
        sector=limpiar_opcional(datos.sector),
        urgente=datos.urgente,
        whatsapp=limpiar_opcional(datos.whatsapp),
        fechaPerdida=datetime.now(timezone.utc),
        activa=True,
    )
    db.add(alerta)
    db.commit()
    db.refresh(alerta)

    # El matching es best-effort: un fallo no debe invalidar la alerta ya persistida.
    try:
        procesar_matches_para_alerta(db, alerta)
    except Exception as e:
        logger.warning(f"Aviso al procesar matches para alerta {alerta.id}: {e}")

    return alerta


def actualizar_foto(
    db: Session, alerta: AlertaPerdida, foto: Optional[UploadFile], foto_url: Optional[str]
) -> Optional[str]:
    """Reemplaza la foto de la mascota asociada y retorna la URL persistida."""
    nueva = procesar_y_optimizar_foto(foto=foto, foto_url=foto_url, prefijo="mascota")
    if nueva:
        alerta.mascota.fotoUrl = nueva
        db.commit()
        db.refresh(alerta)
    return alerta.mascota.fotoUrl
