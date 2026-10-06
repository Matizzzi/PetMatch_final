import base64
import json
import logging
import urllib.request
from typing import Any, Dict, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
]

PROMPT_ANALISIS = (
    "Eres un asistente veterinario experto en rescate de animales y visión computacional para la app PetMatch. "
    "Tu objetivo es analizar la foto del animal y extraer su morfología con alta precisión para una base de datos comunitaria. "
    "Responde EXCLUSIVAMENTE un objeto JSON válido (sin formato markdown, sin bloques de código ```json) con los siguientes campos:\n"
    "{\n"
    '  "especie": "perro" o "gato" o "otro",\n'
    '  "razaEstimada": "nombre de la raza probable o mestizo/cruzado",\n'
    '  "colorPelaje": "colores y patrón del pelaje (ej. Blanco liso, Atigrado marrón, Negro con pecho blanco)",\n'
    '  "tamano": "pequeño" o "mediano" o "grande",\n'
    '  "usaCollar": true o false,\n'
    '  "descripcionCollar": "color o detalles del collar si lo tiene, o null",\n'
    '  "senasParticulares": "manchas visibles, orejas (erguidas/caídas), largo de cola o rasgos distintivos",\n'
    '  "descripcionSugerida": "descripción formal y atractiva de 2 líneas para la alerta de búsqueda"\n'
    "}"
)

def analizar_imagen_con_gemini(
    image_bytes: bytes,
    mime_type: str = "image/jpeg"
) -> Dict[str, Any]:
    """
    Analiza una imagen de mascota utilizando la API de Google Gemini Vision.
    Implementa tolerancia a fallos probando automáticamente modelos alternativos.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY no configurada en el sistema.")

    # Optimizar y comprimir imagen a máximo 800x800 para velocidad instantánea
    try:
        from PIL import Image
        import io
        with Image.open(io.BytesIO(image_bytes)) as img:
            img.thumbnail((800, 800))
            buf = io.BytesIO()
            img.convert("RGB").save(buf, format="JPEG", quality=85)
            compressed_bytes = buf.getvalue()
    except Exception as e:
        logger.warning(f"No se pudo comprimir la imagen con PIL, enviando original: {e}")
        compressed_bytes = image_bytes

    img_b64 = base64.b64encode(compressed_bytes).decode("utf-8")

    payload = json.dumps({
        "contents": [{
            "parts": [
                {"text": PROMPT_ANALISIS},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": img_b64
                    }
                }
            ]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    }).encode("utf-8")

    ultimo_error = None

    for model_name in FALLBACK_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if not candidates:
                    continue

                text_resp = candidates[0]["content"]["parts"][0]["text"].strip()
                # Limpiar posibles delimitadores markdown si el modelo los incluye
                if text_resp.startswith("```"):
                    text_resp = text_resp.strip("`")
                    if text_resp.startswith("json"):
                        text_resp = text_resp[4:].strip()

                resultado = json.loads(text_resp)
                resultado["modeloUtilizado"] = model_name
                logger.info(f"Análisis visual exitoso con modelo {model_name}")
                return resultado

        except Exception as e:
            logger.warning(f"Modelo {model_name} no disponible para análisis: {e}")
            ultimo_error = e
            continue

    raise RuntimeError(f"No fue posible analizar la imagen con los modelos de visión disponibles: {ultimo_error}")


PROMPT_FORENSE = (
    "Eres un perito forense veterinario y experto en identificación biométrica de mascotas perdidas para la app PetMatch. "
    "Se te presentan dos imágenes:\n"
    "- IMAGEN 1: La mascota original reportada por su familia como perdida.\n"
    "- IMAGEN 2: Un animal avistado en la calle por un testigo de la comunidad.\n\n"
    "CRITERIO PERICIAL Y VETERINARIO CRÍTICO:\n"
    "Un animal en situación de calle puede sufrir alteraciones físicas drásticas: pérdida notoria de peso y masa muscular, "
    "pelaje apelmazado o manchado con barro/tierra, ojos entrecerrados por estrés, orejas gachas y postura encorvada. "
    "Tu labor pericial es NO descartar por suciedad o delgadez. Concéntrate en la anatomía invariable: "
    "1) Proporción craneal, hocico y separación interocular.\n"
    "2) Inserción, forma y porte de orejas.\n"
    "3) Patrón base de pelaje y marcas corporales permanentes (manchas en pecho, patas, hocico o cola).\n\n"
    "Responde EXCLUSIVAMENTE un objeto JSON válido (sin formato markdown, sin bloques de código ```json) con los siguientes campos:\n"
    "{\n"
    '  "porcentajeBiometrico": 88,\n'
    '  "veredicto": "ALTA COINCIDENCIA" o "COINCIDENCIA MODERADA" o "BAJA COINCIDENCIA",\n'
    '  "nivelConfianza": "ALTO" o "MEDIO" o "BAJO",\n'
    '  "resumenEjecutivo": "Explicación pericial clara de 2 o 3 oraciones dirigida al dueño, explicando por qué coincide o difiere considerando el estado de calle.",\n'
    '  "rasgosAnalizados": [\n'
    '    {\n'
    '      "nombre": "Estructura craneal y orejas",\n'
    '      "porcentaje": 94,\n'
    '      "observacion": "Detalle anatómico observado..."\n'
    '    },\n'
    '    {\n'
    '      "nombre": "Patrón de manchas y pelaje",\n'
    '      "porcentaje": 90,\n'
    '      "observacion": "Concordancia de manchas..."\n'
    '    },\n'
    '    {\n'
    '      "nombre": "Proporción y tamaño corporal",\n'
    '      "porcentaje": 82,\n'
    '      "observacion": "Estructura compatible..."\n'
    '    }\n'
    '  ],\n'
    '  "factoresCalle": [\n'
    '    "Pelaje apelmazado por suciedad o humedad",\n'
    '    "Pérdida perceptible de masa corporal"\n'
    '  ],\n'
    '  "recomendacion": "Recomendación práctica para confirmación in situ (ej. verificar almohadilla plantar, llamado por su nombre habitual o cicatriz)."\n'
    "}"
)


def comparar_biometria_forense(
    foto_mascota_bytes: bytes,
    foto_avistamiento_bytes: bytes,
    nombre_mascota: Optional[str] = None,
    especie: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compara fotográficamente la mascota original con el animal avistado mediante Gemini Vision Multimodal.
    Evalúa morfología pericial, marcas permanentes y degrada factores de desgaste por estar en la calle.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY no configurada en el sistema.")

    def _comprimir(img_bytes: bytes) -> str:
        try:
            from PIL import Image
            import io
            with Image.open(io.BytesIO(img_bytes)) as img:
                img.thumbnail((800, 800))
                buf = io.BytesIO()
                img.convert("RGB").save(buf, format="JPEG", quality=85)
                comp_bytes = buf.getvalue()
        except Exception as e:
            logger.warning(f"Error comprimiendo imagen: {e}")
            comp_bytes = img_bytes
        return base64.b64encode(comp_bytes).decode("utf-8")

    img1_b64 = _comprimir(foto_mascota_bytes)
    img2_b64 = _comprimir(foto_avistamiento_bytes)

    contexto_extra = ""
    if nombre_mascota or especie:
        contexto_extra = f"\nContexto reportado: Mascota '{nombre_mascota or 'desconocido'}', especie '{especie or 'desconocida'}'."

    payload = json.dumps({
        "contents": [{
            "parts": [
                {"text": PROMPT_FORENSE + contexto_extra},
                {"text": "IMAGEN 1 (Mascota original buscada):"},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": img1_b64
                    }
                },
                {"text": "IMAGEN 2 (Animal avistado en la calle):"},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": img2_b64
                    }
                }
            ]
        }],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    }).encode("utf-8")

    ultimo_error = None

    for model_name in FALLBACK_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if not candidates:
                    continue

                text_resp = candidates[0]["content"]["parts"][0]["text"].strip()
                if text_resp.startswith("```"):
                    text_resp = text_resp.strip("`")
                    if text_resp.startswith("json"):
                        text_resp = text_resp[4:].strip()

                resultado = json.loads(text_resp)
                resultado["modeloUtilizado"] = model_name
                logger.info(f"Comparación biométrica exitosa con modelo {model_name}")
                return resultado

        except Exception as e:
            logger.warning(f"Modelo {model_name} falló en comparación biométrica: {e}")
            ultimo_error = e
            continue

    raise RuntimeError(f"No fue posible realizar la comparación biométrica con los modelos disponibles: {ultimo_error}")

