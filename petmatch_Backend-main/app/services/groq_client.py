"""
Cliente de visión Groq (plan Free).

Compatible con Chat Completions de OpenAI. La clave se lee de GROQ_API_KEY.
"""
import json
import logging
import re
import threading
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.services.gemini_client import _extraer_json, comprimir_imagen_b64

logger = logging.getLogger(__name__)

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
# qwen3.6-27b ya no existe (deprecado 2026-09). Solo este modelo tiene visión en el plan free.
GROQ_MODELS = ("qwen/qwen3.8-27b",)
_GROQ_LOCK = threading.Lock()


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


def _espera_desde_429(detalle: str) -> float:
    encontrado = re.search(r"try again in ([\d.]+)\s*s", detalle, re.I)
    if not encontrado:
        return 8.0
    return min(45.0, float(encontrado.group(1)) + 1.5)


def generar_json_groq(
    prompt: str,
    imagenes: List[bytes],
    timeout: int = 45,
    etiqueta: str = "GROQ",
) -> Dict[str, Any]:
    """Serializa las llamadas: el free tier de Groq no aguanta dos fotos en paralelo."""
    with _GROQ_LOCK:
        return _generar_json_groq_locked(prompt, imagenes, timeout, etiqueta)


def _generar_json_groq_locked(
    prompt: str,
    imagenes: List[bytes],
    timeout: int,
    etiqueta: str,
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
            "max_tokens": 900,
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
        for intento in range(3):
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                texto = (
                    (((data.get("choices") or [{}])[0].get("message") or {}).get("content")) or ""
                )
                if not str(texto).strip():
                    ultimo = "respuesta vacía"
                    break
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
                if e.code == 429:
                    espera = _espera_desde_429(detalle)
                    logger.warning("[%s] cupo Groq, esperando %.1fs (intento %s)", etiqueta, espera, intento + 1)
                    time.sleep(espera)
                    continue
                break
            except Exception as e:
                logger.warning("[%s] %s no disponible: %s", etiqueta, modelo, e)
                ultimo = str(e)
                break

    raise GroqError(f"Groq no respondió: {ultimo}")
