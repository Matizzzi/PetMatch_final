import os
import shutil
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.core.database import get_db, generate_id
from app.api.deps import get_optional_current_user
from app.core.security import get_password_hash
from app.models.usuario import Usuario
from app.models.mascota import Mascota
from app.models.alerta import AlertaPerdida
from app.schemas.alerta import AlertasListResponse, AlertaCreateResponse

from app.services.matching import procesar_matches_para_alerta

router = APIRouter()

def get_or_create_guest_user(db: Session) -> Usuario:
    guest = db.query(Usuario).filter(Usuario.email == "comunidad@petmatch.app").first()
    if not guest:
        guest = Usuario(
            id=generate_id("usr_guest"),
            email="comunidad@petmatch.app",
            password=get_password_hash("guest_petmatch_pass"),
            nombre="Comunidad PetMatch",
            telefono=None
        )
        db.add(guest)
        db.commit()
        db.refresh(guest)
    return guest

@router.get("", response_model=AlertasListResponse)
def list_alertas(
    incluir_resueltas: bool = True,
    db: Session = Depends(get_db)
):
    """Lista todas las alertas ordenadas por estado activo, urgencia y fecha."""
    query = db.query(AlertaPerdida).options(joinedload(AlertaPerdida.mascota))
    if not incluir_resueltas:
        query = query.filter(AlertaPerdida.activa == True)
    alertas = (
        query
        .order_by(AlertaPerdida.activa.desc(), AlertaPerdida.urgente.desc(), AlertaPerdida.createdAt.desc())
        .all()
    )
    return {"alertas": alertas}

@router.patch("/{alerta_id}/resolver")
def marcar_alerta_resuelta(
    alerta_id: str,
    db: Session = Depends(get_db)
):
    """Marca una alerta de mascota como resuelta / reencontrada con su familia."""
    alerta = db.query(AlertaPerdida).options(joinedload(AlertaPerdida.mascota)).filter(AlertaPerdida.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    alerta.activa = False
    db.commit()
    db.refresh(alerta)
    return {
        "success": True,
        "mensaje": "¡Mascota marcada como reencontrada!",
        "alerta": alerta
    }

@router.post("", response_model=AlertaCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_alerta(
    nombreMascota: str = Form(...),
    especie: str = Form(...),
    descripcion: str = Form(...),
    latitud: float = Form(...),
    longitud: float = Form(...),
    sector: Optional[str] = Form(None),
    urgente: bool = Form(False),
    usaCollar: bool = Form(False),
    descripcionCollar: Optional[str] = Form(None),
    tieneChip: bool = Form(False),
    condicionMedica: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    fotoUrl: Optional[str] = Form(None),
    foto: Optional[UploadFile] = File(None),
    current_user: Optional[Usuario] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Crea una nueva alerta de mascota perdida (con o sin usuario registrado)."""
    if not current_user:
        current_user = get_or_create_guest_user(db)
    final_foto_url = fotoUrl
    if foto and foto.filename:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        extension = os.path.splitext(foto.filename)[1] or ".jpg"
        clean_filename = f"mascota_{int(datetime.now().timestamp())}_{generate_id('img')}{extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, clean_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)
            
        final_foto_url = f"{settings.BASE_URL}/uploads/{clean_filename}"

    # 1. Crear mascota
    mascota = Mascota(
        id=generate_id("masc"),
        nombre=nombreMascota.strip(),
        especie=especie.strip(),
        descripcion=descripcion.strip(),
        fotoUrl=final_foto_url,
        usaCollar=usaCollar,
        descripcionCollar=descripcionCollar.strip() if usaCollar and descripcionCollar else None,
        tieneChip=tieneChip,
        condicionMedica=condicionMedica.strip() if condicionMedica else None,
        usuarioId=current_user.id
    )
    db.add(mascota)
    db.flush()

    # 2. Crear alerta
    alerta = AlertaPerdida(
        id=generate_id("alt"),
        mascotaId=mascota.id,
        usuarioId=current_user.id,
        latitud=latitud,
        longitud=longitud,
        sector=sector.strip() if sector else None,
        urgente=urgente,
        whatsapp=whatsapp.strip() if whatsapp else None,
        fechaPerdida=datetime.now(timezone.utc),
        activa=True
    )
    db.add(alerta)
    db.commit()
    db.refresh(alerta)

    # 3. Buscar matches inmediatos con avistamientos existentes
    try:
        procesar_matches_para_alerta(db, alerta)
    except Exception as e:
        print(f"Aviso al procesar matches para alerta: {e}")

    return {
        "success": True,
        "alerta": alerta
    }

