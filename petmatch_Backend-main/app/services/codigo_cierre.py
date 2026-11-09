"""Código de cierre anónimo: quien publica no necesita cuenta para marcar 'ya volvió'."""
import hashlib
import secrets
from typing import Optional

# Sin 0/O/1/I para que se pueda dictar por teléfono sin ambigüedad.
_ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
_LARGO = 8


def generar_codigo_cierre() -> str:
    return "".join(secrets.choice(_ALFABETO) for _ in range(_LARGO))


def normalizar_codigo(codigo: str) -> str:
    return "".join(ch for ch in codigo.upper() if ch.isalnum())


def hashear_codigo(codigo: str) -> str:
    return hashlib.sha256(normalizar_codigo(codigo).encode("utf-8")).hexdigest()


def codigos_coinciden(codigo: str, hash_guardado: Optional[str]) -> bool:
    if not hash_guardado or not codigo:
        return False
    return secrets.compare_digest(hashear_codigo(codigo), hash_guardado)
