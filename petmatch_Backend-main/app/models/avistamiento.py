from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base, generate_id

class ReporteAvistamiento(Base):
    __tablename__ = "reportes_avistamiento"

    id = Column(String, primary_key=True, default=generate_id)
    especie = Column(String, nullable=False)
    descripcion = Column(String, nullable=False)
    fotoUrl = Column("fotoUrl", String, nullable=False)
    latitud = Column(Float, nullable=False)
    longitud = Column(Float, nullable=False)
    fechaAvistamiento = Column("fechaAvistamiento", DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    comuna = Column(String, nullable=True)
    contactoNombre = Column("contactoNombre", String, nullable=True)
    contactoTelefono = Column("contactoTelefono", String, nullable=True)
    contactoEmail = Column("contactoEmail", String, nullable=True)
    procesado = Column(Boolean, default=False, nullable=False, index=True)
    createdAt = Column("createdAt", DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    matches = relationship("Match", back_populates="avistamiento", cascade="all, delete-orphan")
