import math
import re
from datetime import datetime, timezone
from typing import Tuple, Set
from sqlalchemy.orm import Session, joinedload
from app.models.alerta import AlertaPerdida
from app.models.avistamiento import ReporteAvistamiento
from app.models.match import Match
from app.core.database import generate_id

STOPWORDS = {
    "de", "la", "el", "en", "y", "a", "los", "se", "del", "las", "un", "por",
    "con", "no", "una", "su", "para", "es", "al", "lo", "como", "mas", "pero",
    "sus", "le", "ya", "o", "fue", "este", "ha", "si", "porque", "esta", "son",
    "entre", "cuando", "muy", "sin", "sobre", "ser", "tiene", "tambien", "era"
}

def normalizar_texto(texto: str) -> Set[str]:
    """Extrae palabras clave de un texto sin acentos ni signos."""
    if not texto:
        return set()
    limpio = texto.lower()
    for origen, destino in [("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n")]:
        limpio = limpio.replace(origen, destino)
    palabras = re.findall(r"\b[a-z]{3,}\b", limpio)
    return {p for p in palabras if p not in STOPWORDS}

def calcular_distancia_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula la distancia en línea recta en kilómetros usando Haversine."""
    R = 6371.0 # Radio de la Tierra en km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def calcular_score_distancia(dist_km: float) -> float:
    """Asigna puntaje entre 0 y 100 según cercanía geográfica."""
    if dist_km <= 0.5:
        return 100.0
    if dist_km <= 1.0:
        return 92.0
    if dist_km <= 2.5:
        return 80.0
    if dist_km <= 5.0:
        return 65.0
    if dist_km <= 10.0:
        return 40.0
    if dist_km <= 20.0:
        return 20.0
    return 0.0

def normalizar_dt(dt: datetime) -> datetime:
    """Asegura que un datetime tenga zona horaria UTC para poder restarlos."""
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def calcular_score_tiempo(dt_perdida: datetime, dt_avistamiento: datetime) -> float:
    """Asigna puntaje entre 0 y 100 según cercanía temporal."""
    t1 = normalizar_dt(dt_perdida)
    t2 = normalizar_dt(dt_avistamiento)
    horas_dif = abs((t2 - t1).total_seconds()) / 3600.0

    if horas_dif <= 24:
        return 100.0
    if horas_dif <= 72: # 3 días
        return 85.0
    if horas_dif <= 168: # 7 días
        return 70.0
    if horas_dif <= 336: # 14 días
        return 50.0
    if horas_dif <= 720: # 30 días
        return 30.0
    return 10.0

def calcular_score_texto(desc_alerta: str, desc_avistamiento: str) -> float:
    """Compara similitud básica de palabras clave (color, raza, señas)."""
    p1 = normalizar_texto(desc_alerta)
    p2 = normalizar_texto(desc_avistamiento)

    if not p1 or not p2:
        return 50.0 # Neutro si falta descripción

    comunes = p1.intersection(p2)
    if not comunes:
        return 30.0

    # Si tienen varias palabras iguales (por ej: "blanco", "collar", "pequeño")
    ratio = len(comunes) / min(len(p1), len(p2))
    score = min(100.0, 40.0 + (ratio * 60.0))
    return round(score, 1)

def calcular_match_scores(alerta: AlertaPerdida, avistamiento: ReporteAvistamiento) -> Tuple[float, float, float, float]:
    """Retorna (scoreDistancia, scoreTiempo, scoreTexto, scoreTotal)."""
    dist_km = calcular_distancia_km(alerta.latitud, alerta.longitud, avistamiento.latitud, avistamiento.longitud)
    s_dist = calcular_score_distancia(dist_km)
    s_tiempo = calcular_score_tiempo(alerta.fechaPerdida, avistamiento.fechaAvistamiento)

    texto_alerta = f"{alerta.mascota.nombre if alerta.mascota else ''} {alerta.mascota.descripcion if alerta.mascota else ''} {alerta.descripcionExtra or ''}"
    s_texto = calcular_score_texto(texto_alerta, avistamiento.descripcion)

    # Ponderaciones: 55% distancia, 25% tiempo, 20% texto
    score_total = (s_dist * 0.55) + (s_tiempo * 0.25) + (s_texto * 0.20)
    return round(s_dist, 1), round(s_tiempo, 1), round(s_texto, 1), round(score_total, 1)

def especies_coinciden(esp1: str, esp2: str) -> bool:
    """Comprueba si las especies coinciden (normalizando perro/canino, gato/felino)."""
    e1 = (esp1 or "").strip().lower()
    e2 = (esp2 or "").strip().lower()

    if e1 == e2:
        return True
    if ("perr" in e1 or "can" in e1) and ("perr" in e2 or "can" in e2):
        return True
    if ("gat" in e1 or "fel" in e1) and ("gat" in e2 or "fel" in e2):
        return True
    return False

def procesar_matches_para_avistamiento(db: Session, avistamiento: ReporteAvistamiento) -> int:
    """
    Busca todas las alertas activas compatibles y crea los registros de Match
    que superen el umbral de coincidencia (>= 50%).
    """
    alertas_activas = (
        db.query(AlertaPerdida)
        .options(joinedload(AlertaPerdida.mascota))
        .filter(AlertaPerdida.activa == True)
        .all()
    )

    matches_creados = 0
    for alerta in alertas_activas:
        if not alerta.mascota:
            continue
        if not especies_coinciden(alerta.mascota.especie, avistamiento.especie):
            continue

        s_dist, s_tiempo, s_texto, s_total = calcular_match_scores(alerta, avistamiento)

        # Solo guardamos si el puntaje total es relevante (>= 50%)
        if s_total >= 50.0:
            existente = (
                db.query(Match)
                .filter(
                    Match.alertaPerdidaId == alerta.id,
                    Match.reporteAvistamientoId == avistamiento.id
                )
                .first()
            )
            if not existente:
                nuevo_match = Match(
                    id=generate_id("mtc"),
                    alertaPerdidaId=alerta.id,
                    reporteAvistamientoId=avistamiento.id,
                    scoreDistancia=s_dist,
                    scoreTiempo=s_tiempo,
                    scoreTexto=s_texto,
                    scoreTotal=s_total,
                    notificado=False
                )
                db.add(nuevo_match)
                matches_creados += 1

    avistamiento.procesado = True
    db.commit()
    return matches_creados

def procesar_matches_para_alerta(db: Session, alerta: AlertaPerdida) -> int:
    """
    Cuando se crea una nueva alerta de pérdida, busca en los avistamientos
    recientes para ver si alguien ya vio a esta mascota.
    """
    if not alerta.mascota:
        return 0

    avistamientos = (
        db.query(ReporteAvistamiento)
        .order_by(ReporteAvistamiento.createdAt.desc())
        .limit(50)
        .all()
    )

    matches_creados = 0
    for avistamiento in avistamientos:
        if not especies_coinciden(alerta.mascota.especie, avistamiento.especie):
            continue

        s_dist, s_tiempo, s_texto, s_total = calcular_match_scores(alerta, avistamiento)

        if s_total >= 50.0:
            existente = (
                db.query(Match)
                .filter(
                    Match.alertaPerdidaId == alerta.id,
                    Match.reporteAvistamientoId == avistamiento.id
                )
                .first()
            )
            if not existente:
                nuevo_match = Match(
                    id=generate_id("mtc"),
                    alertaPerdidaId=alerta.id,
                    reporteAvistamientoId=avistamiento.id,
                    scoreDistancia=s_dist,
                    scoreTiempo=s_tiempo,
                    scoreTexto=s_texto,
                    scoreTotal=s_total,
                    notificado=False
                )
                db.add(nuevo_match)
                matches_creados += 1

    db.commit()
    return matches_creados
