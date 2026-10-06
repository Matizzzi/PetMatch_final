from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.alerta import AlertaResponse
from app.schemas.avistamiento import AvistamientoResponse

class MatchResponse(BaseModel):
    id: str
    alertaPerdidaId: str
    reporteAvistamientoId: str
    scoreDistancia: float
    scoreTiempo: float
    scoreTexto: float
    scoreTotal: float
    notificado: bool
    createdAt: datetime
    alerta: Optional[AlertaResponse] = None
    avistamiento: Optional[AvistamientoResponse] = None

    class Config:
        from_attributes = True

class MatchesListResponse(BaseModel):
    total: int
    matches: List[MatchResponse]
