from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.match import MatchesListResponse
from app.services import matches_service

router = APIRouter()


@router.get("", response_model=MatchesListResponse)
def list_matches(
    alertaId: Optional[str] = Query(None, description="Filtrar matches por ID de alerta"),
    minScore: float = Query(50.0, description="Puntaje mínimo de match (0 a 100)"),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
):
    """Lista las coincidencias detectadas entre alertas y avistamientos."""
    matches = matches_service.listar_matches(db, alertaId, minScore, limit)
    return {"total": len(matches), "matches": matches}


@router.get("/alerta/{alerta_id}", response_model=MatchesListResponse)
def get_matches_for_alerta(alerta_id: str, db: Session = Depends(get_db)):
    """Obtiene todas las posibles coincidencias para una alerta de pérdida específica."""
    if not matches_service.existe_alerta(db, alerta_id):
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    matches = matches_service.matches_de_alerta(db, alerta_id)
    return {"total": len(matches), "matches": matches}


@router.post("/recalcular-todos")
def recalcular_todos_los_matches(db: Session = Depends(get_db)):
    """Recorre todos los avistamientos y calcula sus matches."""
    return {"success": True, **matches_service.recalcular_todos(db)}
