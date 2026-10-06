from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MascotaResponse(BaseModel):
    id: str
    nombre: str
    especie: str
    descripcion: str
    fotoUrl: Optional[str] = None
    usaCollar: bool = False
    descripcionCollar: Optional[str] = None
    tieneChip: bool = False
    condicionMedica: Optional[str] = None
    usuarioId: str

    class Config:
        from_attributes = True

class AlertaResponse(BaseModel):
    id: str
    mascotaId: str
    usuarioId: str
    latitud: float
    longitud: float
    sector: Optional[str] = None
    urgente: bool = False
    whatsapp: Optional[str] = None
    fechaPerdida: datetime
    activa: bool = True
    createdAt: datetime
    mascota: MascotaResponse

    class Config:
        from_attributes = True

class AlertasListResponse(BaseModel):
    alertas: List[AlertaResponse]

class AlertaCreateResponse(BaseModel):
    success: bool = True
    alerta: AlertaResponse
