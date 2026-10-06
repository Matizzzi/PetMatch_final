from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    nombre: Optional[str] = None

class UsuarioResponse(BaseModel):
    id: str
    email: str
    nombre: str
    telefono: Optional[str] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    success: bool = True
    usuario: UsuarioResponse
    token: str

class MeResponse(BaseModel):
    usuario: UsuarioResponse
