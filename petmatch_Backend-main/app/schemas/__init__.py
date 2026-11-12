"""Contratos Pydantic. Importá desde el módulo del recurso (`app.schemas.alerta`)."""

from app.schemas.alerta import AlertaResponse, AlertasListResponse, AlertaCreateResponse, MascotaResponse
from app.schemas.avistamiento import AvistamientoResponse, AvistamientosListResponse, AvistamientoCreateResponse
from app.schemas.match import MatchResponse, MatchesListResponse

__all__ = [
    "AlertaResponse", "AlertasListResponse", "AlertaCreateResponse", "MascotaResponse",
    "AvistamientoResponse", "AvistamientosListResponse", "AvistamientoCreateResponse",
    "MatchResponse", "MatchesListResponse",
]
