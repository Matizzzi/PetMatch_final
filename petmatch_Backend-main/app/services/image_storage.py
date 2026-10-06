import base64
import io
import os
import logging
from datetime import datetime
from typing import Optional, Tuple
from fastapi import UploadFile
from PIL import Image
from app.core.config import settings
from app.core.database import generate_id

logger = logging.getLogger(__name__)

def procesar_y_optimizar_foto(
    foto: Optional[UploadFile] = None,
    foto_url: Optional[str] = None,
    prefijo: str = "img",
    max_dimension: int = 800,
    calidad: int = 80
) -> Optional[str]:
    """
    Procesa una imagen para que persista 100% en la base de datos PostgreSQL (Neon)
    en formato Data URL (base64) comprimido y optimizado con Pillow (~40-70 KB).
    También guarda una copia física en el directorio local /uploads si está disponible.
    
    Retorna el Data URL (base64) para almacenar directamente en PostgreSQL.
    """
    # 1. Si no hay archivo pero sí una URL remota o base64 existente
    if not foto or not foto.filename:
        if foto_url and foto_url.strip():
            return foto_url.strip()
        return None

    try:
        raw_bytes = foto.file.read()
    except Exception as e:
        logger.warning(f"Error al leer bytes de foto: {e}")
        return foto_url

    if not raw_bytes:
        return foto_url

    # 2. Comprimir y optimizar con Pillow a máximo 800x800 JPEG calidad 80
    data_url = None
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            # Corregir orientación si tiene EXIF
            try:
                from PIL import ImageOps
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            img = img.convert("RGB")
            img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=calidad, optimize=True)
            compressed_bytes = buf.getvalue()
            b64_str = base64.b64encode(compressed_bytes).decode("utf-8")
            data_url = f"data:image/jpeg;base64,{b64_str}"

            # 3. Guardar también copia física en /uploads
            try:
                os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
                clean_filename = f"{prefijo}_{int(datetime.now().timestamp())}_{generate_id('f')}.jpg"
                file_path = os.path.join(settings.UPLOAD_DIR, clean_filename)
                with open(file_path, "wb") as f:
                    f.write(compressed_bytes)
            except Exception as e:
                logger.warning(f"No se pudo guardar copia local en disco: {e}")

    except Exception as e:
        logger.warning(f"Error al procesar imagen con Pillow: {e}")
        b64_str = base64.b64encode(raw_bytes).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64_str}"

    return data_url
