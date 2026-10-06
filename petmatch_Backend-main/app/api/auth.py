from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db, generate_id
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.usuario import Usuario
from app.schemas.auth import AuthRequest, AuthResponse, UsuarioResponse

router = APIRouter()

@router.post("", response_model=AuthResponse)
def authenticate_or_register(data: AuthRequest, db: Session = Depends(get_db)):
    """
    Endpoint unificado de autenticación (Login o Registro):
    - Si el usuario existe, valida contraseña y retorna sesión.
    - Si el usuario no existe y envía 'nombre', lo registra y retorna sesión.
    """
    email_clean = data.email.lower().strip()
    usuario = db.query(Usuario).filter(Usuario.email == email_clean).first()

    if usuario:
        if not verify_password(data.password, usuario.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Contraseña incorrecta"
            )
    else:
        if not data.nombre or len(data.nombre.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre es obligatorio para crear una cuenta (mínimo 2 caracteres)"
            )
        
        hashed_pwd = get_password_hash(data.password)
        usuario = Usuario(
            id=generate_id(),
            email=email_clean,
            password=hashed_pwd,
            nombre=data.nombre.strip()
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    token = create_access_token(usuario.id)

    return {
        "success": True,
        "usuario": {
            "id": usuario.id,
            "email": usuario.email,
            "nombre": usuario.nombre,
            "telefono": usuario.telefono
        },
        "token": token
    }
