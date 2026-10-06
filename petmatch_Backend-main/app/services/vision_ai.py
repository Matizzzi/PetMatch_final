"""
Casos de uso de visión computacional sobre Gemini.

- Análisis morfológico + triaje veterinario de una foto.
- Peritaje biométrico forense entre la mascota perdida y un avistamiento.
"""
from typing import Any, Dict, Optional

from app.prompts.vision import (
    ETIQUETA_IMAGEN_AVISTAMIENTO,
    ETIQUETA_IMAGEN_MASCOTA,
    PROMPT_ANALISIS,
    construir_prompt_forense,
)
from app.services.gemini_client import FALLBACK_MODELS, generar_json
from app.services.triage import normalizar_triaje

__all__ = ["FALLBACK_MODELS", "analizar_imagen_con_gemini", "comparar_biometria_forense"]


def analizar_imagen_con_gemini(image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    """
    Extrae especie, raza, pelaje, tamaño, collar, señas y triaje veterinario.
    `mime_type` se conserva por compatibilidad: la imagen siempre se re-codifica a JPEG.
    """
    try:
        resultado = generar_json([PROMPT_ANALISIS, image_bytes], timeout=30, etiqueta="ANALISIS")
    except RuntimeError as e:
        raise RuntimeError(f"No fue posible analizar la imagen con los modelos de visión disponibles: {e}") from e
    return normalizar_triaje(resultado)


def comparar_biometria_forense(
    foto_mascota_bytes: bytes,
    foto_avistamiento_bytes: bytes,
    nombre_mascota: Optional[str] = None,
    especie: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Compara la mascota original con el animal avistado, priorizando marcas
    anatómicas permanentes por sobre el desgaste de vivir en la calle.
    """
    partes = [
        construir_prompt_forense(nombre_mascota, especie),
        ETIQUETA_IMAGEN_MASCOTA,
        foto_mascota_bytes,
        ETIQUETA_IMAGEN_AVISTAMIENTO,
        foto_avistamiento_bytes,
    ]
    try:
        return generar_json(partes, timeout=40, etiqueta="FORENSE")
    except RuntimeError as e:
        raise RuntimeError(f"No fue posible realizar la comparación biométrica con los modelos disponibles: {e}") from e
