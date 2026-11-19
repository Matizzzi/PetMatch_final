"""
Filtro post-visión: PetMatch solo autocompleta fotos reales de perro/gato.

La clasificación viaja en el mismo JSON de Groq (un solo gasto de tokens).
Si la foto no sirve, se corta el flujo con 422 y no se rellena el formulario.
"""
from typing import Any, Dict, Optional

MENSAJES_RECHAZO = {
    "persona": "La foto parece una persona. Subí una fotografía real de un perro o un gato.",
    "dibujo": "No se aceptan dibujos, caricaturas ni imágenes generadas. Subí una foto real del animal.",
    "meme": "Esa imagen no es una foto de una mascota perdida. Subí una fotografía real de un perro o un gato.",
    "objeto": "No se ve un perro o un gato. Subí una foto clara del animal, de frente o de lado.",
    "otro_animal": "Por ahora PetMatch solo analiza perros y gatos.",
    "ilegible": "La foto está borrosa o no se entiende. Probá con más luz y un solo animal.",
}

AVISO_VARIOS = (
    "Hay más de un animal en la foto. Se analizó el más visible. "
    "Recortá la imagen a un solo perro o gato para un mejor resultado."
)


class FotoNoAptoError(ValueError):
    """La IA vio la imagen pero no es apta para autocompletar una alerta."""

    def __init__(self, motivo: str, mensaje: str):
        super().__init__(mensaje)
        self.motivo = motivo


def _bool_opcional(valor: Any) -> Optional[bool]:
    if valor is None:
        return None
    if isinstance(valor, bool):
        return valor
    if isinstance(valor, (int, float)):
        return bool(valor)
    if isinstance(valor, str):
        t = valor.strip().lower()
        if t in ("true", "1", "si", "sí", "yes"):
            return True
        if t in ("false", "0", "no"):
            return False
    return None


def _motivo(valor: Any) -> Optional[str]:
    if not isinstance(valor, str):
        return None
    clave = valor.strip().lower().replace(" ", "_")
    return clave if clave in MENSAJES_RECHAZO else None


def aplicar_gate(resultado: Dict[str, Any]) -> Dict[str, Any]:
    """Rechaza basura; si hay varios animales deja el análisis del principal + aviso."""
    if resultado.get("modeloUtilizado") == "local":
        resultado["cantidadAnimales"] = 1
        resultado["avisoVariosAnimales"] = None
        resultado["esFotoValida"] = True
        return resultado

    motivo = _motivo(resultado.get("motivoRechazo"))
    valida = _bool_opcional(resultado.get("esFotoValida"))
    if valida is False or motivo:
        clave = motivo or "objeto"
        raise FotoNoAptoError(clave, MENSAJES_RECHAZO[clave])

    especie = str(resultado.get("especie") or "").strip().lower()
    if especie not in ("perro", "gato"):
        raise FotoNoAptoError("otro_animal", MENSAJES_RECHAZO["otro_animal"])

    try:
        cantidad = int(resultado.get("cantidadAnimales") or 1)
    except (TypeError, ValueError):
        cantidad = 1
    cantidad = max(1, min(cantidad, 9))
    resultado["especie"] = especie
    resultado["cantidadAnimales"] = cantidad
    resultado["esFotoValida"] = True
    resultado["motivoRechazo"] = None
    resultado["avisoVariosAnimales"] = AVISO_VARIOS if cantidad > 1 else None
    return resultado
