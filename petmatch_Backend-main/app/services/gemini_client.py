"""
Cliente HTTP mínimo para la API REST de Google Gemini.

Encapsula: compresión de imágenes, construcción del payload multimodal,
fallback entre modelos y parseo robusto de la respuesta JSON.
"""
import base64
import io
import json
import logging
import urllib.error
import urllib.request
from typing import Any, Dict, List, Union

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

# Orden de preferencia: si un modelo falla (cuota, 404, timeout) se prueba el siguiente.
FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
]

# Una parte del prompt puede ser texto plano o bytes de imagen.
ParteContenido = Union[str, bytes]


def comprimir_imagen_b64(image_bytes: bytes, max_dimension: int = 800, calidad: int = 85) -> str:
    """Reduce la imagen a JPEG <= max_dimension px y la devuelve en Base64."""
    try:
        from PIL import Image

        with Image.open(io.BytesIO(image_bytes)) as img:
            img.thumbnail((max_dimension, max_dimension))
            buf = io.BytesIO()
            img.convert("RGB").save(buf, format="JPEG", quality=calidad)
            image_bytes = buf.getvalue()
    except Exception as e:
        logger.warning(f"No se pudo comprimir la imagen con PIL, enviando original: {e}")
    return base64.b64encode(image_bytes).decode("utf-8")


def _construir_payload(partes: List[ParteContenido]) -> bytes:
    parts: List[Dict[str, Any]] = []
    for parte in partes:
        if isinstance(parte, bytes):
            parts.append({"inline_data": {"mime_type": "image/jpeg", "data": comprimir_imagen_b64(parte)}})
        else:
            parts.append({"text": parte})
    return json.dumps({
        "contents": [{"parts": parts}],
        "generationConfig": {"response_mime_type": "application/json", "temperature": 0.2},
    }).encode("utf-8")


def _extraer_json(texto: str) -> Dict[str, Any]:
    """Parsea la respuesta del modelo tolerando delimitadores markdown (```json)."""
    texto = texto.strip()
    if texto.startswith("```"):
        texto = texto.strip("`")
        if texto.startswith("json"):
            texto = texto[4:].strip()
    return json.loads(texto)


def generar_json(partes: List[ParteContenido], timeout: int = 30, etiqueta: str = "GEMINI") -> Dict[str, Any]:
    """
    Envía un prompt multimodal a Gemini y retorna el JSON de respuesta.
    Agrega `modeloUtilizado` al resultado. Lanza RuntimeError si todos los modelos fallan.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY no configurada en el sistema.")

    payload = _construir_payload(partes)
    ultimo_error: Any = None

    for model_name in FALLBACK_MODELS:
        req = urllib.request.Request(
            GEMINI_ENDPOINT.format(model=model_name, key=api_key),
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            candidates = data.get("candidates", [])
            if not candidates:
                continue
            resultado = _extraer_json(candidates[0]["content"]["parts"][0]["text"])
            resultado["modeloUtilizado"] = model_name
            logger.info(f"[{etiqueta}] Respuesta exitosa con modelo {model_name}")
            return resultado
        except urllib.error.HTTPError as e:
            detalle = e.read().decode("utf-8", errors="replace")
            logger.warning(f"[{etiqueta}] {model_name} HTTP {e.code}: {detalle}")
            ultimo_error = f"HTTP {e.code}: {detalle}"
        except Exception as e:
            logger.warning(f"[{etiqueta}] {model_name} no disponible: {e}")
            ultimo_error = e

    raise RuntimeError(f"Ningún modelo de Gemini respondió correctamente: {ultimo_error}")
