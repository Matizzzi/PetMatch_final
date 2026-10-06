from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.auth import MeResponse

router = APIRouter()

@router.get("", response_model=MeResponse)
def get_current_user_profile(current_user: Usuario = Depends(get_current_user)):
    """Retorna los datos del usuario autenticado."""
    return {
        "usuario": {
            "id": current_user.id,
            "nombre": current_user.nombre,
            "email": current_user.email,
            "telefono": current_user.telefono
        }
    }
