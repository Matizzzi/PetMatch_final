"""
Cliente de visión Groq (plan Free).

Compatible con Chat Completions de OpenAI. La clave se lee de GROQ_API_KEY.
"""
import json
import logging
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.services.gemini_client import _extraer_json, comprimir_imagen_b64

logger = logging.getLogger(__name__)

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODELS = (
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
)


class GroqError(RuntimeError):
    """Fallo al llamar a Groq."""


def _partes_imagen(imagenes: List[bytes]) -> List[Dict[str, Any]]:
    partes: List[Dict[str, Any]] = []
    for raw in imagenes[:3]:
        b64 = comprimir_imagen_b64(raw, max_dimension=768, calidad=80)
        partes.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
        })
    return partes


def generar_json_groq(
    prompt: str,
    imagenes: List[bytes],
    timeout: int = 45,
    etiqueta: str = "GROQ",
) -> Dict[str, Any]:
    api_key = (settings.GROQ_API_KEY or "").strip()
    if not api_key:
        raise GroqError("Falta GROQ_API_KEY.")

    contenido = [{"type": "text", "text": prompt}, *_partes_imagen(imagenes)]
    ultimo: Optional[str] = None

    for modelo in GROQ_MODELS:
        payload = json.dumps({
            "model": modelo,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": contenido}],
        }).encode("utf-8")
        req = urllib.request.Request(
            GROQ_ENDPOINT,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                # Groq (Cloudflare) rechaza el User-Agent por defecto de urllib.
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
                ),
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            texto = (
                (((data.get("choices") or [{}])[0].get("message") or {}).get("content")) or ""
            )
            if not str(texto).strip():
                ultimo = "respuesta vacía"
                continue
            resultado = _extraer_json(str(texto))
            resultado["modeloUtilizado"] = modelo
            logger.info("[%s] OK con %s", etiqueta, modelo)
            return resultado
        except urllib.error.HTTPError as e:
            detalle = e.read().decode("utf-8", errors="replace")
            logger.warning("[%s] %s HTTP %s: %s", etiqueta, modelo, e.code, detalle[:400])
            ultimo = f"HTTP {e.code}: {detalle[:200]}"
            if e.code == 401:
                raise GroqError(
                    "La clave de Groq no es válida. Creá otra en https://console.groq.com/keys"
                ) from e
            if e.code == 403 and "1010" in detalle:
                ultimo = "Cloudflare bloqueó la salida (1010). Se reintenta el siguiente modelo."
        except Exception as e:
            logger.warning("[%s] %s no disponible: %s", etiqueta, modelo, e)
            ultimo = str(e)

    raise GroqError(f"Groq no respondió: {ultimo}")
