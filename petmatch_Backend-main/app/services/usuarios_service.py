from sqlalchemy.orm import Session

from app.core.database import generate_id
from app.core.security import get_password_hash
from app.models.usuario import Usuario

GUEST_EMAIL = "comunidad@petmatch.app"


def get_or_create_guest_user(db: Session) -> Usuario:
    """Usuario genérico al que se asocian las alertas publicadas sin sesión iniciada."""
    guest = db.query(Usuario).filter(Usuario.email == GUEST_EMAIL).first()
    if guest:
        return guest

    guest = Usuario(
        id=generate_id("usr_guest"),
        email=GUEST_EMAIL,
        password=get_password_hash("guest_petmatch_pass"),
        nombre="Comunidad PetMatch",
        telefono=None,
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest
