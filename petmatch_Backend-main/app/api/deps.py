from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.alerta import AlertaPerdida
from app.models.usuario import Usuario
from app.services.usuarios_service import es_usuario_invitado

security_scheme = HTTPBearer(auto_error=False)

def get_token_from_request(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[str]:
    # 1. Header Authorization: Bearer <token>
    if credentials and credentials.credentials:
        return credentials.credentials
    
    # 2. Cookie 'sesion' (usado por el cliente web si aplica)
    token = request.cookies.get("sesion")
    if token:
        return token
        
    return None

def get_current_user(
    token: Optional[str] = Depends(get_token_from_request),
    db: Session = Depends(get_db)
) -> Usuario:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Debes iniciar sesión primero"
        )
    
    usuario_id = decode_access_token(token)
    if not usuario_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return usuario

def get_optional_current_user(
    token: Optional[str] = Depends(get_token_from_request),
    db: Session = Depends(get_db)
) -> Optional[Usuario]:
    if not token:
        return None
    usuario_id = decode_access_token(token)
    if not usuario_id:
        return None
    return db.query(Usuario).filter(Usuario.id == usuario_id).first()


def exigir_propietario_alerta(alerta: AlertaPerdida, usuario: Usuario) -> None:
    """Solo el dueño con sesión real puede cerrar o cambiar la alerta."""
    if es_usuario_invitado(usuario) or alerta.usuarioId != usuario.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo quien publicó esta alerta (con sesión iniciada) puede modificarla.",
        )
