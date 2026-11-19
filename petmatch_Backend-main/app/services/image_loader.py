"""
Obtención de bytes de imagen: multipart, Data URL, /uploads local o HTTPS público.
"""
import os
from typing import Optional, Tuple

from starlette.datastructures import UploadFile

from app.core.config import settings
from app.core.foto_segura import (
    FotoInvalidaError,
    decodificar_data_url,
    descargar_https_publica,
    ruta_local_upload,
    validar_bytes_imagen,
)

ImagenInvalidaError = FotoInvalidaError


def _es_data_url(url: str) -> bool:
    return url.startswith("data:") and "," in url


async def leer_imagen_de_request(
    foto: Optional[UploadFile], foto_url: Optional[str]
) -> Tuple[bytes, str]:
    """
    Resuelve la imagen enviada al endpoint de análisis.
    Lanza FotoInvalidaError con un mensaje apto para responder 400.
    """
    if foto is not None:
        contents = await foto.read()
        if contents:
            if contents.lstrip().startswith(b"data:"):
                raw, mime = decodificar_data_url(contents.decode("utf-8", errors="replace"))
                return validar_bytes_imagen(raw), mime
            return validar_bytes_imagen(contents), foto.content_type or "image/jpeg"

    if not foto_url:
        raise FotoInvalidaError(
            "Debes adjuntar un archivo de imagen ('foto') o proporcionar una URL válida ('fotoUrl')."
        )

    url = foto_url.strip()
    if _es_data_url(url):
        raw, mime = decodificar_data_url(url)
        return validar_bytes_imagen(raw), mime

    local = ruta_local_upload(url)
    if os.path.exists(local):
        with open(local, "rb") as f:
            return validar_bytes_imagen(f.read()), "image/jpeg"

    try:
        return descargar_https_publica(url, timeout=15)
    except FotoInvalidaError:
        raise
    except Exception as e:
        raise FotoInvalidaError(
            f"No se pudo descargar o abrir la imagen de la URL proporcionada: {e}"
        ) from e


def cargar_bytes_imagen(url: Optional[str]) -> bytes:
    """
    Carga una imagen para el peritaje forense. Ante datos corruptos o archivos
    locales inexistentes recurre a una imagen de muestra para no bloquear el flujo.
    """
    fallback = settings.IMAGE_FALLBACK_URL
    target = url.strip() if url else fallback

    if _es_data_url(target):
        try:
            return validar_bytes_imagen(decodificar_data_url(target)[0])
        except Exception:
            return cargar_bytes_imagen(fallback)

    local = ruta_local_upload(target)
    if os.path.exists(local):
        with open(local, "rb") as f:
            return validar_bytes_imagen(f.read())

    es_upload_local = "uploads/" in target and (
        "localhost" in target or "127.0.0.1" in target or not target.startswith("https://")
    )
    if es_upload_local:
        target = fallback

    try:
        return descargar_https_publica(target, timeout=15)[0]
    except Exception:
        if target == fallback:
            raise
        return descargar_https_publica(fallback, timeout=10)[0]
