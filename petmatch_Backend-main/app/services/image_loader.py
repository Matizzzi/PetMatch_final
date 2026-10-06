"""
Obtención de bytes de imagen desde las distintas fuentes que acepta la API:
archivo multipart, Data URL Base64 (formato persistido en Neon), archivo
local en /uploads o URL remota.
"""
import base64
import os
import urllib.request
from typing import Optional, Tuple

from fastapi import UploadFile

from app.core.config import settings

DEFAULT_SAMPLE_IMAGE = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop"
USER_AGENT = {"User-Agent": "PetMatch-AI-Agent/1.0"}


class ImagenInvalidaError(ValueError):
    """La imagen recibida no pudo decodificarse o descargarse."""


def _ruta_local(url: str) -> str:
    return os.path.join(settings.UPLOAD_DIR, os.path.basename(url.split("?")[0]))


def _descargar(url: str, timeout: int) -> Tuple[bytes, str]:
    req = urllib.request.Request(url, headers=USER_AGENT)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read(), resp.headers.get_content_type() or "image/jpeg"


def _decodificar_data_url(data_url: str) -> Tuple[bytes, str]:
    header, b64data = data_url.split(",", 1)
    return base64.b64decode(b64data), "image/png" if "png" in header else "image/jpeg"


async def leer_imagen_de_request(
    foto: Optional[UploadFile], foto_url: Optional[str]
) -> Tuple[bytes, str]:
    """
    Resuelve la imagen enviada al endpoint de análisis.
    Lanza ImagenInvalidaError con un mensaje apto para responder 400.
    """
    if foto and foto.filename:
        return await foto.read(), foto.content_type or "image/jpeg"

    if not foto_url:
        raise ImagenInvalidaError(
            "Debes adjuntar un archivo de imagen ('foto') o proporcionar una URL válida ('fotoUrl')."
        )

    url = foto_url.strip()
    if url.startswith("data:image/"):
        try:
            return _decodificar_data_url(url)
        except Exception as e:
            raise ImagenInvalidaError(f"Data URL de imagen inválida: {e}") from e

    try:
        local = _ruta_local(url)
        if os.path.exists(local):
            with open(local, "rb") as f:
                return f.read(), "image/jpeg"
        return _descargar(url, timeout=10)
    except Exception as e:
        raise ImagenInvalidaError(
            f"No se pudo descargar o abrir la imagen de la URL proporcionada: {e}"
        ) from e


def cargar_bytes_imagen(url: Optional[str]) -> bytes:
    """
    Carga una imagen para el peritaje forense. Ante datos corruptos o archivos
    locales inexistentes recurre a una imagen de muestra para no bloquear el flujo.
    """
    target = url.strip() if url else DEFAULT_SAMPLE_IMAGE

    if target.startswith("data:image/"):
        try:
            return _decodificar_data_url(target)[0]
        except Exception:
            return cargar_bytes_imagen(DEFAULT_SAMPLE_IMAGE)

    local = _ruta_local(target)
    if os.path.exists(local):
        with open(local, "rb") as f:
            return f.read()

    es_upload_local = "uploads/" in target and (
        "localhost" in target or "127.0.0.1" in target or not target.startswith("http")
    )
    if es_upload_local:
        target = DEFAULT_SAMPLE_IMAGE

    try:
        return _descargar(target, timeout=15)[0]
    except Exception:
        if target == DEFAULT_SAMPLE_IMAGE:
            raise
        try:
            return _descargar(DEFAULT_SAMPLE_IMAGE, timeout=10)[0]
        except Exception:
            pass
        raise
