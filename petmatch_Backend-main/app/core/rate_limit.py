"""Límite en memoria por IP y ámbito (IA, publicaciones, cierre)."""
import ipaddress
import time
from collections import defaultdict, deque
from typing import Deque, DefaultDict

from fastapi import HTTPException, Request, status

from app.core.config import settings

_ventanas: DefaultDict[str, Deque[float]] = defaultdict(deque)


def _es_peer_proxy(host: str) -> bool:
    try:
        addr = ipaddress.ip_address(host)
    except ValueError:
        return host in {"localhost", "unix"}
    return bool(addr.is_private or addr.is_loopback)


def ip_cliente(request: Request) -> str:
    """
    Peer directo, salvo que venga de un proxy local/privado (Nginx, Render):
    entonces el primer X-Forwarded-For.
    """
    host = request.client.host if request.client else ""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded and (not host or _es_peer_proxy(host)):
        return forwarded.split(",")[0].strip() or host or "unknown"
    return host or "unknown"


def limitar(
    request: Request,
    max_hits: int,
    ventana_s: int,
    detalle: str,
    ambito: str = "default",
) -> None:
    clave = f"{ambito}:{ip_cliente(request)}"
    ahora = time.monotonic()
    cola = _ventanas[clave]
    corte = ahora - ventana_s
    while cola and cola[0] < corte:
        cola.popleft()
    if len(cola) >= max_hits:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detalle)
    cola.append(ahora)


def limitar_ia(request: Request) -> None:
    limitar(
        request,
        max_hits=settings.IA_DIA_MAX,
        ventana_s=settings.IA_DIA_VENTANA_S,
        ambito="ia-dia",
        detalle=(
            "Llegaste al máximo de análisis de IA por hoy, para no gastar la cuota. "
            "Completá pelaje y señas a mano, o volvé mañana."
        ),
    )
    limitar(
        request,
        max_hits=settings.IA_RATE_MAX,
        ventana_s=settings.IA_RATE_VENTANA_S,
        ambito="ia",
        detalle="Demasiadas consultas de IA desde esta red. Espera unos minutos e inténtalo de nuevo.",
    )


def limitar_publicar(request: Request) -> None:
    limitar(
        request,
        max_hits=settings.PUBLICAR_RATE_MAX,
        ventana_s=settings.PUBLICAR_RATE_VENTANA_S,
        ambito="publicar",
        detalle="Demasiadas publicaciones desde esta red. Espera unos minutos e inténtalo de nuevo.",
    )


def limitar_cierre(request: Request) -> None:
    limitar(
        request,
        max_hits=settings.CIERRE_RATE_MAX,
        ventana_s=settings.CIERRE_RATE_VENTANA_S,
        ambito="cierre",
        detalle="Demasiados intentos de cierre. Espera unos minutos e inténtalo de nuevo.",
    )
