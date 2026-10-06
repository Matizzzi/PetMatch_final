from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.match import Match
from app.models.alerta import AlertaPerdida
from app.models.avistamiento import ReporteAvistamiento
from app.schemas.match import MatchesListResponse, MatchResponse
from app.services.matching import procesar_matches_para_avistamiento, procesar_matches_para_alerta

router = APIRouter()

@router.get("", response_model=MatchesListResponse)
def list_matches(
    alertaId: Optional[str] = Query(None, description="Filtrar matches por ID de alerta"),
    minScore: float = Query(50.0, description="Puntaje mínimo de match (0 a 100)"),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Lista las coincidencias detectadas entre alertas y avistamientos."""
    query = (
        db.query(Match)
        .options(
            joinedload(Match.alerta).joinedload(AlertaPerdida.mascota),
            joinedload(Match.avistamiento)
        )
        .filter(Match.scoreTotal >= minScore)
    )

    if alertaId:
        query = query.filter(Match.alertaPerdidaId == alertaId)

    matches = query.order_by(Match.scoreTotal.desc(), Match.createdAt.desc()).limit(limit).all()

    # Si no hay matches para esta alerta específica, calcular en tiempo real
    if not matches and alertaId:
        alerta = db.query(AlertaPerdida).filter(AlertaPerdida.id == alertaId).first()
        if alerta:
            nuevos = procesar_matches_para_alerta(db, alerta)
            if nuevos > 0:
                matches = query.order_by(Match.scoreTotal.desc(), Match.createdAt.desc()).limit(limit).all()

    return {
        "total": len(matches),
        "matches": matches
    }

@router.get("/alerta/{alerta_id}", response_model=MatchesListResponse)
def get_matches_for_alerta(alerta_id: str, db: Session = Depends(get_db)):
    """Obtiene todas las posibles coincidencias para una alerta de pérdida específica."""
    alerta = db.query(AlertaPerdida).filter(AlertaPerdida.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")

    matches = (
        db.query(Match)
        .options(
            joinedload(Match.avistamiento),
            joinedload(Match.alerta).joinedload(AlertaPerdida.mascota)
        )
        .filter(Match.alertaPerdidaId == alerta_id)
        .order_by(Match.scoreTotal.desc())
        .all()
    )

    return {
        "total": len(matches),
        "matches": matches
    }

@router.post("/recalcular-todos")
def recalcular_todos_los_matches(db: Session = Depends(get_db)):
    """Recorre todos los avistamientos no procesados y calcula sus matches."""
    avistamientos = db.query(ReporteAvistamiento).all()
    total_generados = 0
    for av in avistamientos:
        total_generados += procesar_matches_para_avistamiento(db, av)
    return {
        "success": True,
        "avistamientosProcesados": len(avistamientos),
        "matchesGenerados": total_generados
    }
