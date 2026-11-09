"""
Análisis de fotos de mascotas.

Orden de proveedores (las claves viven solo en .env):
1. Groq, si hay GROQ_API_KEY
2. Gemini, si hay GEMINI_API_KEY
3. Análisis local con Pillow (sin nube)
"""
import logging
from typing import Any, Dict, Optional

from app.core.config import settings
from app.prompts.vision import (
    ETIQUETA_IMAGEN_AVISTAMIENTO,
    ETIQUETA_IMAGEN_MASCOTA,
    PROMPT_ANALISIS,
    construir_prompt_forense,
)
from app.services.gemini_client import FALLBACK_MODELS, GeminiAuthError, GeminiError, generar_json
from app.services.groq_client import GroqError, generar_json_groq
from app.services.triage import normalizar_triaje
from app.services.vision_local import analizar_imagen_local, comparar_local

logger = logging.getLogger(__name__)

__all__ = ["FALLBACK_MODELS", "analizar_imagen", "comparar_biometria_forense"]


def analizar_imagen(image_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    """Especie, raza, pelaje, tamaño, collar, señas y triaje veterinario."""
    del mime_type
    if (settings.GROQ_API_KEY or "").strip():
        try:
            return normalizar_triaje(
                generar_json_groq(PROMPT_ANALISIS, [image_bytes], timeout=12, etiqueta="ANALISIS")
            )
        except GroqError as e:
            logger.warning("Groq no disponible, se intenta Gemini: %s", e)

    try:
        return normalizar_triaje(generar_json([PROMPT_ANALISIS, image_bytes], timeout=12, etiqueta="ANALISIS"))
    except (GeminiAuthError, GeminiError) as e:
        logger.warning("Gemini no disponible, se usa análisis local: %s", e)
        return normalizar_triaje(analizar_imagen_local(image_bytes))
    except Exception as e:
        logger.warning("Fallo inesperado de visión, se usa análisis local: %s", e)
        return normalizar_triaje(analizar_imagen_local(image_bytes))


def comparar_biometria_forense(
    foto_mascota_bytes: bytes,
    foto_avistamiento_bytes: bytes,
    nombre_mascota: Optional[str] = None,
    especie: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = construir_prompt_forense(nombre_mascota, especie)
    if (settings.GROQ_API_KEY or "").strip():
        try:
            return generar_json_groq(
                "\n".join([prompt, ETIQUETA_IMAGEN_MASCOTA, ETIQUETA_IMAGEN_AVISTAMIENTO]),
                [foto_mascota_bytes, foto_avistamiento_bytes],
                timeout=12,
                etiqueta="FORENSE",
            )
        except GroqError as e:
            logger.warning("Groq no disponible para forense, se intenta Gemini: %s", e)

    partes = [
        prompt,
        ETIQUETA_IMAGEN_MASCOTA,
        foto_mascota_bytes,
        ETIQUETA_IMAGEN_AVISTAMIENTO,
        foto_avistamiento_bytes,
    ]
    try:
        return generar_json(partes, timeout=12, etiqueta="FORENSE")
    except (GeminiAuthError, GeminiError) as e:
        logger.warning("Gemini no disponible para forense, se usa modo local: %s", e)
        return comparar_local()
    except Exception as e:
        logger.warning("Fallo inesperado de Gemini en forense, se usa modo local: %s", e)
        return comparar_local()
