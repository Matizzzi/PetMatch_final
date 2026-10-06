"""Consultas de coincidencias (matches) entre alertas y avistamientos."""
from typing import Dict, List, Optional

from sqlalchemy.orm import Query, Session, joinedload

from app.models.alerta import AlertaPerdida
from app.models.avistamiento import ReporteAvistamiento
from app.models.match import Match
from app.services.matching import procesar_matches_para_alerta, procesar_matches_para_avistamiento


def _query_con_relaciones(db: Session) -> Query:
    return db.query(Match).options(
        joinedload(Match.alerta).joinedload(AlertaPerdida.mascota),
        joinedload(Match.avistamiento),
    )


def listar_matches(
    db: Session, alerta_id: Optional[str], min_score: float, limit: int
) -> List[Match]:
    """
    Matches con score >= min_score. Si se filtra por alerta y aún no existen,
    se calculan en tiempo real para no depender de que el job previo haya corrido.
    """
    query = _query_con_relaciones(db).filter(Match.scoreTotal >= min_score)
    if alerta_id:
        query = query.filter(Match.alertaPerdidaId == alerta_id)
    ordenada = query.order_by(Match.scoreTotal.desc(), Match.createdAt.desc()).limit(limit)

    matches = ordenada.all()
    if not matches and alerta_id:
        alerta = db.query(AlertaPerdida).filter(AlertaPerdida.id == alerta_id).first()
        if alerta and procesar_matches_para_alerta(db, alerta) > 0:
            matches = ordenada.all()
    return matches


def existe_alerta(db: Session, alerta_id: str) -> bool:
    return db.query(AlertaPerdida.id).filter(AlertaPerdida.id == alerta_id).first() is not None


def matches_de_alerta(db: Session, alerta_id: str) -> List[Match]:
    return (
        _query_con_relaciones(db)
        .filter(Match.alertaPerdidaId == alerta_id)
        .order_by(Match.scoreTotal.desc())
        .all()
    )


def recalcular_todos(db: Session) -> Dict[str, int]:
    """Recorre todos los avistamientos y (re)calcula sus matches."""
    avistamientos = db.query(ReporteAvistamiento).all()
    generados = sum(procesar_matches_para_avistamiento(db, av) for av in avistamientos)
    return {"avistamientosProcesados": len(avistamientos), "matchesGenerados": generados}
