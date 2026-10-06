from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AvistamientoResponse(BaseModel):
    id: str
    especie: str
    descripcion: str
    fotoUrl: str
    latitud: float
    longitud: float
    comuna: Optional[str] = None
    contactoNombre: Optional[str] = None
    contactoTelefono: Optional[str] = None
    contactoEmail: Optional[str] = None
    procesado: bool = False
    fechaAvistamiento: datetime
    createdAt: datetime

    class Config:
        from_attributes = True

class AvistamientosListResponse(BaseModel):
    avistamientos: List[AvistamientoResponse]

class AvistamientoCreateResponse(BaseModel):
    success: bool = True
    reporte: AvistamientoResponse


class AvistamientoCreateForm(BaseModel):
    """Campos multipart de POST /api/avistamientos (la foto viaja aparte como UploadFile)."""
    especie: str
    descripcion: str
    latitud: float
    longitud: float
    comuna: Optional[str] = None
    contactoNombre: Optional[str] = None
    contactoTelefono: Optional[str] = None
    contactoEmail: Optional[str] = None
    fotoUrl: Optional[str] = None
