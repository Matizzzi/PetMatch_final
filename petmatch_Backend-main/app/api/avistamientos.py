import os
import shutil
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, generate_id
from app.models.avistamiento import ReporteAvistamiento
from app.schemas.avistamiento import AvistamientosListResponse, AvistamientoCreateResponse

from app.services.matching import procesar_matches_para_avistamiento

router = APIRouter()

@router.get("", response_model=AvistamientosListResponse)
def list_avistamientos(db: Session = Depends(get_db)):
    """Lista los últimos 50 avistamientos registrados."""
    avistamientos = (
        db.query(ReporteAvistamiento)
        .order_by(ReporteAvistamiento.createdAt.desc())
        .limit(50)
        .all()
    )
    return {"avistamientos": avistamientos}

@router.post("", response_model=AvistamientoCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_avistamiento(
    especie: str = Form(...),
    descripcion: str = Form(...),
    latitud: float = Form(...),
    longitud: float = Form(...),
    comuna: Optional[str] = Form(None),
    contactoNombre: Optional[str] = Form(None),
    contactoTelefono: Optional[str] = Form(None),
    contactoEmail: Optional[str] = Form(None),
    fotoUrl: Optional[str] = Form(None),
    foto: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Crea un nuevo reporte de avistamiento comunitario y calcula matches inmediatos."""
    final_foto_url = fotoUrl
    if foto and foto.filename:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        extension = os.path.splitext(foto.filename)[1] or ".jpg"
        clean_filename = f"avistamiento_{int(datetime.now().timestamp())}_{generate_id('img')}{extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, clean_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)

        final_foto_url = f"{settings.BASE_URL}/uploads/{clean_filename}"
    elif not final_foto_url:
        final_foto_url = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop"

    reporte = ReporteAvistamiento(
        id=generate_id("avist"),
        especie=especie.strip(),
        descripcion=descripcion.strip(),
        fotoUrl=final_foto_url,
        latitud=latitud,
        longitud=longitud,
        comuna=comuna.strip() if comuna else None,
        contactoNombre=contactoNombre.strip() if contactoNombre else None,
        contactoTelefono=contactoTelefono.strip() if contactoTelefono else None,
        contactoEmail=contactoEmail.strip() if contactoEmail else None,
        fechaAvistamiento=datetime.now(timezone.utc),
        procesado=False
    )
    db.add(reporte)
    db.commit()
    db.refresh(reporte)

    # Calcular matches de inmediato con alertas activas
    try:
        procesar_matches_para_avistamiento(db, reporte)
    except Exception as e:
        print(f"Aviso al procesar matches: {e}")

    return {
        "success": True,
        "reporte": reporte
    }

