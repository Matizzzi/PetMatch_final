from typing import Optional, Tuple

from fastapi import APIRouter, HTTPException, Request, UploadFile, status

from app.schemas.vision import CompararForenseRequest
from app.services.image_loader import ImagenInvalidaError, cargar_bytes_imagen, leer_imagen_de_request
from app.services.vision_ai import analizar_imagen_con_gemini, comparar_biometria_forense

router = APIRouter()


async def _foto_desde_request(request: Request) -> Tuple[Optional[UploadFile], Optional[str]]:
    """
    Acepta JSON `{ "fotoUrl": "data:image/..." }` (app Android) o multipart
    `foto` / `fotoUrl` (web y clientes antiguos). No se declaran File()/Form()
    en la firma: si lo hiciéramos, FastAPI rechazaría el JSON con 422.
    """
    content_type = (request.headers.get("content-type") or "").lower()
    if "application/json" in content_type:
        body = await request.json()
        if not isinstance(body, dict):
            return None, None
        raw = body.get("fotoUrl")
        return None, raw.strip() if isinstance(raw, str) and raw.strip() else None

    form = await request.form()
    raw = form.get("fotoUrl")
    foto_url = raw.strip() if isinstance(raw, str) and raw.strip() else None
    upload = form.get("foto")
    foto = upload if isinstance(upload, UploadFile) else None
    return foto, foto_url


@router.post("/analizar", status_code=status.HTTP_200_OK)
async def analizar_mascota(request: Request):
    """
    Analiza la fotografía de una mascota con Gemini Vision.
    Extrae especie, raza estimada, pelaje, tamaño, collar, señas particulares y triaje veterinario.
    """
    try:
        foto, foto_url = await _foto_desde_request(request)
        image_bytes, mime_type = await leer_imagen_de_request(foto, foto_url)
    except ImagenInvalidaError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pudo leer el cuerpo de la petición: {e}",
        )

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes adjuntar un archivo de imagen ('foto') o proporcionar una URL válida ('fotoUrl').",
        )

    try:
        return {"success": True, "analisis": analizar_imagen_con_gemini(image_bytes, mime_type)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la imagen con Inteligencia Artificial: {e}",
        )


@router.post("/comparar-forense", status_code=status.HTTP_200_OK)
async def comparar_forense(req_body: CompararForenseRequest):
    """
    Compara pericialmente la mascota perdida con un avistamiento mediante Gemini Vision,
    discriminando marcas permanentes del desgaste por vivir en la calle.
    """
    try:
        bytes_mascota = cargar_bytes_imagen(req_body.fotoMascotaUrl)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pudo cargar la foto original de la mascota: {e}",
        )

    try:
        bytes_avistamiento = cargar_bytes_imagen(req_body.fotoAvistamientoUrl)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pudo cargar la foto del animal avistado: {e}",
        )

    try:
        informe = comparar_biometria_forense(
            foto_mascota_bytes=bytes_mascota,
            foto_avistamiento_bytes=bytes_avistamiento,
            nombre_mascota=req_body.nombreMascota,
            especie=req_body.especie,
        )
        return {"success": True, "informe": informe}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante el análisis biométrico forense: {e}",
        )
