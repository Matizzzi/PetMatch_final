"""Límite simple en memoria (por IP) para no gastar cuota de visión."""
import time
from collections import defaultdict, deque
from typing import Deque, DefaultDict

from fastapi import HTTPException, Request, status

from app.core.config import settings

_ventanas: DefaultDict[str, Deque[float]] = defaultdict(deque)


def ip_cliente(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def limitar(request: Request, max_hits: int, ventana_s: int, detalle: str) -> None:
    clave = ip_cliente(request)
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
        max_hits=settings.IA_RATE_MAX,
        ventana_s=settings.IA_RATE_VENTANA_S,
        detalle="Demasiadas consultas de IA desde esta red. Espera unos minutos e inténtalo de nuevo.",
    )
