"""Usuario interno al que se cuelgan las alertas anónimas (FK, no hay login)."""
import secrets

import bcrypt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import generate_id
from app.models.usuario import Usuario

GUEST_EMAIL = settings.GUEST_EMAIL


def get_or_create_guest_user(db: Session) -> Usuario:
    guest = db.query(Usuario).filter(Usuario.email == GUEST_EMAIL).first()
    if guest:
        return guest

    password_hash = bcrypt.hashpw(
        secrets.token_urlsafe(24).encode("utf-8"),
        bcrypt.gensalt(rounds=10),
    ).decode("utf-8")
    guest = Usuario(
        id=generate_id("usr_guest"),
        email=GUEST_EMAIL,
        password=password_hash,
        nombre=settings.GUEST_NAME,
        telefono=None,
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest
