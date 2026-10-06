from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base, generate_id

class Match(Base):
    __tablename__ = "matches"

    id = Column(String, primary_key=True, default=generate_id)
    alertaPerdidaId = Column("alertaPerdidaId", String, ForeignKey("alertas_perdida.id", ondelete="CASCADE"), nullable=False)
    reporteAvistamientoId = Column("reporteAvistamientoId", String, ForeignKey("reportes_avistamiento.id", ondelete="CASCADE"), nullable=False)
    scoreDistancia = Column("scoreDistancia", Float, nullable=False)
    scoreTiempo = Column("scoreTiempo", Float, nullable=False)
    scoreTexto = Column("scoreTexto", Float, nullable=False)
    scoreTotal = Column("scoreTotal", Float, nullable=False, index=True)
    notificado = Column(Boolean, default=False, nullable=False)
    createdAt = Column("createdAt", DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    alerta = relationship("AlertaPerdida", back_populates="matches")
    avistamiento = relationship("ReporteAvistamiento", back_populates="matches")

    __table_args__ = (
        UniqueConstraint("alertaPerdidaId", "reporteAvistamientoId", name="matches_alertaPerdidaId_reporteAvistamientoId_key"),
    )
