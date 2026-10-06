"""
Dependencias que traducen campos multipart (Form) a schemas Pydantic.

FastAPI no expande un modelo `Annotated[Model, Form()]` cuando el mismo
endpoint también recibe un `UploadFile`, así que los campos se declaran aquí
explícitamente y los routers reciben un objeto ya validado.
"""
from typing import Optional

from fastapi import Form

from app.schemas.alerta import AlertaCreateForm
from app.schemas.avistamiento import AvistamientoCreateForm


def alerta_create_form(
    nombreMascota: str = Form(...),
    especie: str = Form(...),
    descripcion: str = Form(...),
    latitud: float = Form(...),
    longitud: float = Form(...),
    sector: Optional[str] = Form(None),
    urgente: bool = Form(False),
    usaCollar: bool = Form(False),
    descripcionCollar: Optional[str] = Form(None),
    tieneChip: bool = Form(False),
    condicionMedica: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    fotoUrl: Optional[str] = Form(None),
) -> AlertaCreateForm:
    return AlertaCreateForm(
        nombreMascota=nombreMascota,
        especie=especie,
        descripcion=descripcion,
        latitud=latitud,
        longitud=longitud,
        sector=sector,
        urgente=urgente,
        usaCollar=usaCollar,
        descripcionCollar=descripcionCollar,
        tieneChip=tieneChip,
        condicionMedica=condicionMedica,
        whatsapp=whatsapp,
        fotoUrl=fotoUrl,
    )


def avistamiento_create_form(
    especie: str = Form(...),
    descripcion: str = Form(...),
    latitud: float = Form(...),
    longitud: float = Form(...),
    comuna: Optional[str] = Form(None),
    contactoNombre: Optional[str] = Form(None),
    contactoTelefono: Optional[str] = Form(None),
    contactoEmail: Optional[str] = Form(None),
    fotoUrl: Optional[str] = Form(None),
) -> AvistamientoCreateForm:
    return AvistamientoCreateForm(
        especie=especie,
        descripcion=descripcion,
        latitud=latitud,
        longitud=longitud,
        comuna=comuna,
        contactoNombre=contactoNombre,
        contactoTelefono=contactoTelefono,
        contactoEmail=contactoEmail,
        fotoUrl=fotoUrl,
    )
