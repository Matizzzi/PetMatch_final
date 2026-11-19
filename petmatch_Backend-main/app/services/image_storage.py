import base64
import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import UploadFile

from app.core.config import settings
from app.core.database import generate_id
from app.core.foto_segura import FotoInvalidaError, rasterizar_jpeg

logger = logging.getLogger(__name__)


def _bytes_de_upload(foto: Optional[UploadFile], foto_url: Optional[str]) -> Optional[bytes]:
    if foto is not None and getattr(foto, "filename", None):
        try:
            raw = foto.file.read()
        except Exception as e:
            raise FotoInvalidaError("No se pudo leer el archivo de la foto.") from e
        return raw or None

    if not foto_url or not foto_url.strip():
        return None

    url = foto_url.strip()
    if url.startswith("data:image/"):
        from app.core.foto_segura import decodificar_data_url

        return decodificar_data_url(url)[0]

    if url.startswith("http://") or url.startswith("https://"):
        raise FotoInvalidaError(
            "La foto debe enviarse como archivo o Data URL, no como URL remota."
        )
    raise FotoInvalidaError("Formato de foto no permitido.")


def procesar_y_optimizar_foto(
    foto: Optional[UploadFile] = None,
    foto_url: Optional[str] = None,
    prefijo: str = "img",
    max_dimension: int = 800,
    calidad: int = 80,
) -> Optional[str]:
    """
    Re-encode a JPEG Data URL para Neon. Si Pillow no puede rasterizar, se rechaza
    (no se persisten bytes crudos).
    """
    raw = _bytes_de_upload(foto, foto_url)
    if not raw:
        return None

    compressed = rasterizar_jpeg(raw, max_dimension=max_dimension, calidad=calidad)
    data_url = f"data:image/jpeg;base64,{base64.b64encode(compressed).decode('utf-8')}"

    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        clean_filename = f"{prefijo}_{int(datetime.now().timestamp())}_{generate_id('f')}.jpg"
        with open(os.path.join(settings.UPLOAD_DIR, clean_filename), "wb") as f:
            f.write(compressed)
    except Exception as e:
        logger.warning(f"No se pudo guardar copia local en disco: {e}")

    return data_url
