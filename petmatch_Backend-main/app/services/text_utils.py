from typing import Optional


def limpiar_opcional(valor: Optional[str]) -> Optional[str]:
    """Aplica strip y convierte strings vacíos en None."""
    if not valor:
        return None
    limpio = valor.strip()
    return limpio or None
