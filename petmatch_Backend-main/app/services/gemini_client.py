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
from typing import Any, Dict, List, Optional, Union

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Orden de preferencia (nov 2026): si un modelo falla (cuota, 404, timeout) se prueba el siguiente.
FALLBACK_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
]

ParteContenido = Union[str, bytes]


class GeminiAuthError(RuntimeError):
    """Clave inválida, cuenta deshabilitada o GEMINI_API_KEY ausente."""


class GeminiError(RuntimeError):
    """Fallo de Gemini que no es de autenticación."""


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


def _texto_de_respuesta(data: Dict[str, Any]) -> Optional[str]:
    for candidato in data.get("candidates") or []:
        contenido = candidato.get("content") or {}
        for part in contenido.get("parts") or []:
            texto = part.get("text")
            if isinstance(texto, str) and texto.strip():
                return texto
    feedback = data.get("promptFeedback") or {}
    bloqueo = feedback.get("blockReason")
    if bloqueo:
        raise GeminiError(f"Gemini bloqueó la imagen ({bloqueo}). Prueba con otra foto más clara.")
    return None


def _mensaje_http(codigo: int, cuerpo: str) -> str:
    motivo = ""
    try:
        parsed = json.loads(cuerpo)
        err = parsed.get("error") or {}
        motivo = str(err.get("message") or err.get("status") or "")
    except Exception:
        motivo = (cuerpo or "")[:300]
    if "free tier is not available" in cuerpo or "set up billing" in cuerpo or "project-unavailable" in cuerpo:
        return (
            "Gemini exige activar facturación en este proyecto de Google "
            "(el plan gratuito no está disponible). "
            "Entrá a https://aistudio.google.com/billing, vinculá una tarjeta y volvé a intentar. "
            "El uso de Flash/Flash-Lite suele quedar en el cupo gratuito."
        )
    if codigo == 401 or "ACCOUNT_STATE_INVALID" in cuerpo or "UNAUTHENTICATED" in cuerpo:
        return (
            "La clave de Gemini no es válida o la cuenta de Google está deshabilitada. "
            "Crea una clave nueva en https://aistudio.google.com/apikey "
            "y ponla en GEMINI_API_KEY del archivo .env."
        )
    if codigo == 403:
        return motivo or "Gemini rechazó el acceso (403). Revisá permisos y facturación en Google AI Studio."
    if codigo == 429:
        return "Gemini alcanzó el límite de uso. Espera un minuto e inténtalo de nuevo."
    return f"Gemini HTTP {codigo}: {motivo or 'error desconocido'}"


def generar_json(partes: List[ParteContenido], timeout: int = 30, etiqueta: str = "GEMINI") -> Dict[str, Any]:
    """
    Envía un prompt multimodal a Gemini y retorna el JSON de respuesta.
    Agrega `modeloUtilizado` al resultado.
    """
    api_key = (settings.GEMINI_API_KEY or "").strip()
    if not api_key:
        raise GeminiAuthError(
            "Falta GEMINI_API_KEY. Crea una clave en https://aistudio.google.com/apikey "
            "y agrégala al archivo .env."
        )

    payload = _construir_payload(partes)
    ultimo_error: Any = None
    auth_fallida = False

    for model_name in FALLBACK_MODELS:
        req = urllib.request.Request(
            GEMINI_ENDPOINT.format(model=model_name),
            data=payload,
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            texto = _texto_de_respuesta(data)
            if not texto:
                logger.warning(f"[{etiqueta}] {model_name} sin texto en la respuesta")
                ultimo_error = "respuesta vacía"
                continue
            resultado = _extraer_json(texto)
            resultado["modeloUtilizado"] = model_name
            logger.info(f"[{etiqueta}] Respuesta exitosa con modelo {model_name}")
            return resultado
        except GeminiError:
            raise
        except urllib.error.HTTPError as e:
            detalle = e.read().decode("utf-8", errors="replace")
            logger.warning(f"[{etiqueta}] {model_name} HTTP {e.code}: {detalle}")
            ultimo_error = _mensaje_http(e.code, detalle)
            if e.code == 401 or e.code == 403:
                auth_fallida = True
                break
        except Exception as e:
            logger.warning(f"[{etiqueta}] {model_name} no disponible: {e}")
            ultimo_error = e

    if auth_fallida:
        raise GeminiAuthError(str(ultimo_error))
    raise GeminiError(f"Ningún modelo de Gemini respondió correctamente: {ultimo_error}")
