"""
Prompts de Gemini Vision.

Se mantienen separados de la lógica de ejecución para poder iterarlos
(ingeniería de prompts) sin tocar el cliente HTTP ni los servicios.
"""
from typing import Optional

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
    '  "descripcionSugerida": "descripción formal y atractiva de 2 líneas para la alerta de búsqueda",\n'
    '  "condicionCorporal": {"puntaje": 1 a 5, "descripcion": "1=muy bajo peso / desnutrición visible, 2=bajo peso, 3=peso normal, 4=sobrepeso, 5=obesidad"},\n'
    '  "lesionesVisibles": true o false,\n'
    '  "descripcionLesiones": "detalle clínico breve de heridas, sangrado, cojera, sarna, parásitos, ojos irritados, etc. o null si no hay",\n'
    '  "nivelUrgencia": "ALTA" o "MEDIA" o "BAJA"\n'
    "}\n\n"
    "CRITERIOS DE TRIAJE VETERINARIO:\n"
    "- ALTA: heridas abiertas o sangrado, fracturas o cojera evidente, desnutrición severa (condicionCorporal 1), "
    "sarna extensa, ojos muy inflamados, cachorro muy pequeño solo o animal postrado.\n"
    "- MEDIA: bajo peso (condicionCorporal 2), lesiones leves, pelaje muy deteriorado o signos de parásitos.\n"
    "- BAJA: sin lesiones visibles y peso normal.\n"
    "Evalúa solo lo observable en la foto; no inventes lesiones. Si la imagen no permite evaluar, usa condicionCorporal 3, "
    "lesionesVisibles false y nivelUrgencia BAJA."
)

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

ETIQUETA_IMAGEN_MASCOTA = "IMAGEN 1 (Mascota original buscada):"
ETIQUETA_IMAGEN_AVISTAMIENTO = "IMAGEN 2 (Animal avistado en la calle):"


def construir_prompt_forense(nombre_mascota: Optional[str], especie: Optional[str]) -> str:
    """Agrega al prompt forense el contexto declarado por el dueño, si existe."""
    if not (nombre_mascota or especie):
        return PROMPT_FORENSE
    return (
        f"{PROMPT_FORENSE}\nContexto reportado: Mascota '{nombre_mascota or 'desconocido'}', "
        f"especie '{especie or 'desconocida'}'."
    )
