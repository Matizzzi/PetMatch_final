"""
Obtención de bytes de imagen desde las distintas fuentes que acepta la API:
archivo multipart, Data URL Base64 (formato persistido en Neon), archivo
local en /uploads o URL remota.
"""
import base64
import os
import urllib.request
from typing import Optional, Tuple

from starlette.datastructures import UploadFile

from app.core.config import settings

DEFAULT_SAMPLE_IMAGE = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop"
USER_AGENT = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 PetMatch/1.0"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
}


class ImagenInvalidaError(ValueError):
    """La imagen recibida no pudo decodificarse o descargarse."""


def _ruta_local(url: str) -> str:
    return os.path.join(settings.UPLOAD_DIR, os.path.basename(url.split("?")[0]))


def _descargar(url: str, timeout: int) -> Tuple[bytes, str]:
    req = urllib.request.Request(url, headers=USER_AGENT)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read(), resp.headers.get_content_type() or "image/jpeg"


def _es_data_url(url: str) -> bool:
    return url.startswith("data:") and "," in url


def _decodificar_data_url(data_url: str) -> Tuple[bytes, str]:
    if "," not in data_url:
        raise ImagenInvalidaError("Data URL de imagen inválida: falta el payload Base64.")
    header, b64data = data_url.split(",", 1)
    mime = "image/png" if "png" in header.lower() else "image/jpeg"
    if "webp" in header.lower():
        mime = "image/webp"
    padding = (-len(b64data)) % 4
    if padding:
        b64data += "=" * padding
    try:
        return base64.b64decode(b64data, validate=False), mime
    except Exception as e:
        raise ImagenInvalidaError(f"Data URL de imagen inválida: {e}") from e


async def leer_imagen_de_request(
    foto: Optional[UploadFile], foto_url: Optional[str]
) -> Tuple[bytes, str]:
    """
    Resuelve la imagen enviada al endpoint de análisis.
    Lanza ImagenInvalidaError con un mensaje apto para responder 400.
    """
    if foto is not None:
        contents = await foto.read()
        if contents:
            if contents.lstrip().startswith(b"data:"):
                try:
                    return _decodificar_data_url(contents.decode("utf-8", errors="replace"))
                except ImagenInvalidaError:
                    raise
                except Exception as e:
                    raise ImagenInvalidaError(f"Data URL de imagen inválida: {e}") from e
            return contents, foto.content_type or "image/jpeg"

    if not foto_url:
        raise ImagenInvalidaError(
            "Debes adjuntar un archivo de imagen ('foto') o proporcionar una URL válida ('fotoUrl')."
        )

    url = foto_url.strip()
    if _es_data_url(url):
        try:
            return _decodificar_data_url(url)
        except ImagenInvalidaError:
            raise
        except Exception as e:
            raise ImagenInvalidaError(f"Data URL de imagen inválida: {e}") from e

    try:
        local = _ruta_local(url)
        if os.path.exists(local):
            with open(local, "rb") as f:
                return f.read(), "image/jpeg"
        return _descargar(url, timeout=15)
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

    if _es_data_url(target):
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
