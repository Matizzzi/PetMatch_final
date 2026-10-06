"""
Normalización del triaje veterinario devuelto por la IA.

El modelo puede omitir campos o responder con tipos inconsistentes
("true" como string, puntaje fuera de rango, etc.). Este módulo garantiza
un contrato estable para el frontend.
"""
from typing import Any, Dict

NIVELES_URGENCIA = ("ALTA", "MEDIA", "BAJA")

DESCRIPCION_CONDICION = {
    1: "Muy bajo peso / desnutrición visible",
    2: "Bajo peso",
    3: "Peso normal",
    4: "Sobrepeso",
    5: "Obesidad",
}


def _normalizar_condicion(valor: Any) -> Dict[str, Any]:
    puntaje = valor.get("puntaje") if isinstance(valor, dict) else valor
    try:
        puntaje = min(5, max(1, int(puntaje)))
    except (TypeError, ValueError):
        puntaje = 3
    descripcion = valor.get("descripcion") if isinstance(valor, dict) else None
    return {"puntaje": puntaje, "descripcion": descripcion or DESCRIPCION_CONDICION[puntaje]}


def _normalizar_booleano(valor: Any) -> bool:
    if isinstance(valor, str):
        return valor.strip().lower() in ("true", "si", "sí", "1")
    return bool(valor)


def _normalizar_texto_opcional(valor: Any) -> Any:
    if not isinstance(valor, str):
        return None
    limpio = valor.strip()
    return None if not limpio or limpio.lower() == "null" else limpio


def normalizar_triaje(resultado: Dict[str, Any]) -> Dict[str, Any]:
    """Completa y sanea los campos de triaje sobre el dict de análisis (in place)."""
    condicion = _normalizar_condicion(resultado.get("condicionCorporal"))
    lesiones = _normalizar_booleano(resultado.get("lesionesVisibles"))

    urgencia = str(resultado.get("nivelUrgencia") or "").strip().upper()
    if urgencia not in NIVELES_URGENCIA:
        # Sin veredicto explícito del modelo se infiere desde los signos observados.
        urgencia = "MEDIA" if lesiones or condicion["puntaje"] <= 2 else "BAJA"

    resultado["condicionCorporal"] = condicion
    resultado["lesionesVisibles"] = lesiones
    resultado["descripcionLesiones"] = _normalizar_texto_opcional(resultado.get("descripcionLesiones"))
    resultado["nivelUrgencia"] = urgencia
    return resultado
