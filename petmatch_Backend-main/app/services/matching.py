import math
import re
from datetime import datetime, timezone
from typing import FrozenSet, Set, Tuple

from sqlalchemy.orm import Session, joinedload

from app.core.database import generate_id
from app.models.alerta import AlertaPerdida
from app.models.avistamiento import ReporteAvistamiento
from app.models.match import Match

STOPWORDS = {
    "de", "la", "el", "en", "y", "a", "los", "se", "del", "las", "un", "por",
    "con", "no", "una", "su", "para", "es", "al", "lo", "como", "mas", "pero",
    "sus", "le", "ya", "o", "fue", "este", "ha", "si", "porque", "esta", "son",
    "entre", "cuando", "muy", "sin", "sobre", "ser", "tiene", "tambien", "era",
    "melipilla", "calle", "plaza", "avenida", "pasaje", "mascota", "animal",
    "perdido", "perdida", "visto", "avistado", "sector", "cerca", "zona",
    "centro", "reporte", "reporto", "alguien", "persona", "dueno", "duena",
    "perro", "perra", "gato", "gata", "cachorro", "adulto",
}

# Pelajes que no pueden ser el mismo animal si cada ficha apunta a uno distinto.
PALETAS_COLOR: Tuple[FrozenSet[str], ...] = (
    frozenset({"blanco", "blanca", "blancos", "crema", "beige", "nieve"}),
    frozenset({"negro", "negra", "negros", "oscuro", "oscura"}),
    frozenset({"marron", "cafe", "canela", "chocolate", "pardo"}),
    frozenset({"naranja", "anaranjado", "rufo", "dorado", "gold", "ginger"}),
    frozenset({"gris", "plateado", "ceniza"}),
    frozenset({"atigrado", "rayado", "tabby"}),
)

# Zona y hora solas no alcanzan. Hay que tener rasgos compatibles.
UMBRAL_MATCH = 62.0


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
    R = 6371.0
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
    if horas_dif <= 72:
        return 85.0
    if horas_dif <= 168:
        return 70.0
    if horas_dif <= 336:
        return 50.0
    if horas_dif <= 720:
        return 30.0
    return 10.0


def _paletas_en(palabras: Set[str]) -> Set[int]:
    return {i for i, paleta in enumerate(PALETAS_COLOR) if palabras & paleta}


def calcular_score_texto(desc_alerta: str, desc_avistamiento: str) -> float:
    """Compara color, raza y señas. Pelajes opuestos o sin texto no puntúan alto."""
    p1 = normalizar_texto(desc_alerta)
    p2 = normalizar_texto(desc_avistamiento)

    if not p1 or not p2:
        return 18.0

    pal1, pal2 = _paletas_en(p1), _paletas_en(p2)
    if pal1 and pal2 and pal1.isdisjoint(pal2):
        return 8.0

    comunes = p1.intersection(p2)
    if not comunes:
        return 22.0

    ratio = len(comunes) / min(len(p1), len(p2))
    extra = 14.0 if pal1 & pal2 else 0.0
    return round(min(100.0, 28.0 + (ratio * 55.0) + extra), 1)


def calcular_match_scores(alerta: AlertaPerdida, avistamiento: ReporteAvistamiento) -> Tuple[float, float, float, float]:
    """Retorna (scoreDistancia, scoreTiempo, scoreTexto, scoreTotal)."""
    dist_km = calcular_distancia_km(alerta.latitud, alerta.longitud, avistamiento.latitud, avistamiento.longitud)
    s_dist = calcular_score_distancia(dist_km)
    s_tiempo = calcular_score_tiempo(alerta.fechaPerdida, avistamiento.fechaAvistamiento)

    mascota = alerta.mascota
    texto_alerta = " ".join(
        filter(
            None,
            [
                mascota.nombre if mascota else "",
                mascota.descripcion if mascota else "",
                mascota.descripcionCollar if mascota else "",
                alerta.descripcionExtra or "",
            ],
        )
    )
    s_texto = calcular_score_texto(texto_alerta, avistamiento.descripcion)

    # Los rasgos pesan más que estar en la misma comuna el mismo día.
    score_total = (s_dist * 0.25) + (s_tiempo * 0.15) + (s_texto * 0.60)
    if s_texto < 35:
        score_total = min(score_total, 52.0)
    if s_texto <= 8:
        score_total = min(score_total, 34.0)
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


def _persistir_match(
    db: Session,
    alerta: AlertaPerdida,
    avistamiento: ReporteAvistamiento,
    s_dist: float,
    s_tiempo: float,
    s_texto: float,
    s_total: float,
) -> bool:
    """Crea o actualiza el match. Si el puntaje ya no alcanza, lo borra."""
    existente = (
        db.query(Match)
        .filter(
            Match.alertaPerdidaId == alerta.id,
            Match.reporteAvistamientoId == avistamiento.id,
        )
        .first()
    )

    if s_total < UMBRAL_MATCH:
        if existente:
            db.delete(existente)
        return False

    if existente:
        existente.scoreDistancia = s_dist
        existente.scoreTiempo = s_tiempo
        existente.scoreTexto = s_texto
        existente.scoreTotal = s_total
        return True

    db.add(
        Match(
            id=generate_id("mtc"),
            alertaPerdidaId=alerta.id,
            reporteAvistamientoId=avistamiento.id,
            scoreDistancia=s_dist,
            scoreTiempo=s_tiempo,
            scoreTexto=s_texto,
            scoreTotal=s_total,
            notificado=False,
        )
    )
    return True


def procesar_matches_para_avistamiento(db: Session, avistamiento: ReporteAvistamiento) -> int:
    """Cruza un avistamiento con alertas activas de la misma especie."""
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
        if _persistir_match(db, alerta, avistamiento, s_dist, s_tiempo, s_texto, s_total):
            matches_creados += 1

    avistamiento.procesado = True
    db.commit()
    return matches_creados


def procesar_matches_para_alerta(db: Session, alerta: AlertaPerdida) -> int:
    """Cuando se publica una pérdida, busca avistamientos recientes de la misma especie."""
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
        if _persistir_match(db, alerta, avistamiento, s_dist, s_tiempo, s_texto, s_total):
            matches_creados += 1

    db.commit()
    return matches_creados
