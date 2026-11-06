"""
Respaldo local de visión cuando no hay proveedor en la nube.

Estima pelaje por colores dominantes (Pillow). No infiere raza.
"""
import io
import logging
from collections import Counter
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)

NOMBRES_COLOR = (
    ((15, 15, 15), "negro"),
    ((40, 40, 40), "negro"),
    ((90, 90, 90), "gris oscuro"),
    ((160, 160, 160), "gris"),
    ((230, 230, 230), "blanco"),
    ((250, 250, 250), "blanco"),
    ((80, 50, 30), "marrón oscuro"),
    ((130, 85, 45), "marrón"),
    ((180, 130, 70), "canela"),
    ((210, 170, 110), "crema"),
    ((230, 200, 150), "beige"),
    ((200, 150, 60), "dorado"),
    ((220, 120, 40), "naranja"),
    ((160, 70, 30), "rojizo"),
    ((50, 80, 40), "oliva"),
    ((120, 80, 50), "atigrado marrón"),
)


def _nombre_color(rgb: Tuple[int, int, int]) -> str:
    r, g, b = rgb
    mejor, dist = "marrón", 1e9
    for (cr, cg, cb), nombre in NOMBRES_COLOR:
        d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        if d < dist:
            mejor, dist = nombre, d
    return mejor


def _colores_dominantes(img, cuantos: int = 4) -> List[Tuple[str, float]]:
    muestra = img.convert("RGB").resize((64, 64))
    pixeles = list(muestra.getdata())
    # Cuantiza a 32 niveles para agrupar tonos cercanos.
    agrupado = Counter(((r // 32) * 32, (g // 32) * 32, (b // 32) * 32) for r, g, b in pixeles)
    total = sum(agrupado.values()) or 1
    top = agrupado.most_common(cuantos)
    return [(_nombre_color(color), round(100 * n / total)) for color, n in top if n / total >= 0.08]


def analizar_imagen_local(image_bytes: bytes) -> Dict[str, Any]:
    """Devuelve el mismo contrato JSON que Gemini, con pelaje estimado en local."""
    from PIL import Image, ImageStat

    with Image.open(io.BytesIO(image_bytes)) as img:
        img = img.convert("RGB")
        ancho, alto = img.size
        stats = ImageStat.Stat(img)
        brillo = sum(stats.mean) / 3
        contrastes = stats.stddev
        contraste = sum(contrastes) / 3
        colores = _colores_dominantes(img)

    nombres = []
    vistos = set()
    for nombre, _pct in colores:
        if nombre not in vistos:
            vistos.add(nombre)
            nombres.append(nombre)
    pelaje = " y ".join(nombres[:3]) if nombres else "no determinado"

    if contraste > 55 and len(nombres) >= 2:
        patron = f"{pelaje} (patrón mixto / manchas)"
    else:
        patron = pelaje

    if max(ancho, alto) >= 1600:
        tamano = "mediano"
    else:
        tamano = "mediano"

    senas = f"Pelaje {patron}."
    if brillo < 55:
        senas += " Foto oscura; conviene otra más iluminada para el matching."
    elif brillo > 200:
        senas += " Foto muy clara; algunos detalles pueden perderse."

    logger.info("Análisis local de foto: pelaje=%s brillo=%.0f", patron, brillo)
    return {
        "especie": "otro",
        "razaEstimada": "No determinada (análisis local)",
        "colorPelaje": patron,
        "tamano": tamano,
        "usaCollar": False,
        "descripcionCollar": None,
        "senasParticulares": senas,
        "descripcionSugerida": (
            f"Mascota de pelaje {patron}. "
            "Completá raza y señas si las conocés; el matching mejora con esos datos."
        ),
        "condicionCorporal": {"puntaje": 3, "descripcion": "No evaluable sin modelo de visión"},
        "lesionesVisibles": False,
        "descripcionLesiones": None,
        "nivelUrgencia": "BAJA",
        "modeloUtilizado": "local",
    }


def comparar_local() -> Dict[str, Any]:
    return {
        "porcentajeBiometrico": 50,
        "veredicto": "COINCIDENCIA MODERADA",
        "nivelConfianza": "BAJO",
        "resumenEjecutivo": (
            "No hay un proveedor de visión en la nube configurado. "
            "Compara las fotos de forma manual."
        ),
        "rasgosAnalizados": [
            {
                "nombre": "Análisis automático",
                "porcentaje": 50,
                "observacion": "Modo local: no hay comparación de marcas anatómicas.",
            }
        ],
        "factoresCalle": [],
        "recomendacion": "Compara collar, manchas y hocico en persona.",
        "modeloUtilizado": "local",
    }
