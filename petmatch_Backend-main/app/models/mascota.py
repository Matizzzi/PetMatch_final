from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, generate_id

class Mascota(Base):
    __tablename__ = "mascotas"

    id = Column(String, primary_key=True, default=generate_id)
    nombre = Column(String, nullable=False)
    especie = Column(String, nullable=False)
    descripcion = Column(String, nullable=False)
    fotoUrl = Column(String, nullable=True)
    usaCollar = Column(Boolean, default=False, nullable=False)
    descripcionCollar = Column(String, nullable=True)
    tieneChip = Column(Boolean, default=False, nullable=False)
    condicionMedica = Column(String, nullable=True)
    usuarioId = Column(String, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    createdAt = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    usuario = relationship("Usuario", back_populates="mascotas")
    alertas = relationship("AlertaPerdida", back_populates="mascota", cascade="all, delete-orphan")
