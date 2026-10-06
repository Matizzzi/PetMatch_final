from typing import Optional

from pydantic import BaseModel


class CompararForenseRequest(BaseModel):
    """Cuerpo JSON de POST /api/ia/comparar-forense."""
    fotoMascotaUrl: str
    fotoAvistamientoUrl: str
    nombreMascota: Optional[str] = None
    especie: Optional[str] = None
