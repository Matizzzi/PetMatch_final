import os
import urllib.request
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.services.vision_ai import analizar_imagen_con_gemini

router = APIRouter()

@router.post("/analizar", status_code=status.HTTP_200_OK)
async def analizar_mascota(
    foto: Optional[UploadFile] = File(None),
    fotoUrl: Optional[str] = Form(None)
):
    """
    Analiza la fotografía de una mascota mediante Inteligencia Artificial Multimodal (Gemini Vision).
    Extrae automáticamente: especie, raza estimada, pelaje, tamaño, collar y señas particulares.
    """
    image_bytes = None
    mime_type = "image/jpeg"

    if foto and foto.filename:
        image_bytes = await foto.read()
        mime_type = foto.content_type or "image/jpeg"

    elif fotoUrl:
        # Si es una URL local o remota
        try:
            # Si apunta al directorio de uploads local
            filename = os.path.basename(fotoUrl)
            local_path = os.path.join(settings.UPLOAD_DIR, filename)
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    image_bytes = f.read()
            else:
                req = urllib.request.Request(
                    fotoUrl,
                    headers={"User-Agent": "PetMatch-AI-Agent/1.0"}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    image_bytes = resp.read()
                    mime_type = resp.headers.get_content_type() or "image/jpeg"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se pudo descargar o abrir la imagen de la URL proporcionada: {e}"
            )

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes adjuntar un archivo de imagen ('foto') o proporcionar una URL válida ('fotoUrl')."
        )

    try:
        resultado = analizar_imagen_con_gemini(image_bytes, mime_type)
        return {
            "success": True,
            "analisis": resultado
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la imagen con Inteligencia Artificial: {str(e)}"
        )


from pydantic import BaseModel

class CompararForenseRequest(BaseModel):
    fotoMascotaUrl: str
    fotoAvistamientoUrl: str
    nombreMascota: Optional[str] = None
    especie: Optional[str] = None


from app.services.vision_ai import comparar_biometria_forense


def _cargar_bytes_imagen(url: str) -> bytes:
    if not url:
        raise ValueError("URL de imagen vacía o inválida.")
    
    # 1. Si es archivo local en directorio uploads
    filename = os.path.basename(url.split("?")[0])
    local_path = os.path.join(settings.UPLOAD_DIR, filename)
    if os.path.exists(local_path):
        with open(local_path, "rb") as f:
            return f.read()

    # 2. Si es URL remota
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "PetMatch-AI-Agent/1.0"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read()


@router.post("/comparar-forense", status_code=status.HTTP_200_OK)
async def comparar_forense(req_body: CompararForenseRequest):
    """
    Compara pericialmente dos imágenes de mascotas mediante IA multimodal Gemini Vision.
    Genera un informe biométrico detallado, discriminando marcas permanentes de desgaste por estar en la calle.
    """
    try:
        bytes1 = _cargar_bytes_imagen(req_body.fotoMascotaUrl)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pudo cargar la foto original de la mascota: {e}"
        )

    try:
        bytes2 = _cargar_bytes_imagen(req_body.fotoAvistamientoUrl)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pudo cargar la foto del animal avistado: {e}"
        )

    try:
        informe = comparar_biometria_forense(
            foto_mascota_bytes=bytes1,
            foto_avistamiento_bytes=bytes2,
            nombre_mascota=req_body.nombreMascota,
            especie=req_body.especie
        )
        return {
            "success": True,
            "informe": informe
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante el análisis biométrico forense: {str(e)}"
        )

