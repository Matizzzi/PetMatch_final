from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base, generate_id

class AlertaPerdida(Base):
    __tablename__ = "alertas_perdida"

    id = Column(String, primary_key=True, default=generate_id)
    mascotaId = Column("mascotaId", String, ForeignKey("mascotas.id", ondelete="CASCADE"), nullable=False, index=True)
    usuarioId = Column("usuarioId", String, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)
    fechaPerdida = Column("fechaPerdida", DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    comuna = Column(String, nullable=True)
    sector = Column(String, nullable=True)
    urgente = Column(Boolean, default=False, nullable=False)
    descripcionExtra = Column("descripcionExtra", String, nullable=True)
    activa = Column(Boolean, default=True, nullable=False, index=True)
    whatsapp = Column(String, nullable=True)
    createdAt = Column("createdAt", DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    mascota = relationship("Mascota", back_populates="alertas")
    usuario = relationship("Usuario", back_populates="alertas")
    matches = relationship("Match", back_populates="alerta", cascade="all, delete-orphan")
