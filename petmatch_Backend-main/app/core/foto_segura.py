"""
Controles de imagen: tamaño, firma, re-encode JPEG y SSRF en URLs remotas.

La foto del usuario nunca se persiste ni se descarga “tal cual”.
"""
from __future__ import annotations

import base64
import io
import ipaddress
import os
import socket
from typing import Optional, Tuple
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from PIL import Image, ImageOps

from app.core.config import settings

Image.MAX_IMAGE_PIXELS = settings.FOTO_MAX_PIXELS

_JPEG = b"\xff\xd8\xff"
_PNG = b"\x89PNG\r\n\x1a\n"
_GIF87 = b"GIF87a"
_GIF89 = b"GIF89a"

_UA = {
    "User-Agent": "PetMatch/1.0 (image-fetch)",
    "Accept": "image/jpeg,image/png,image/webp,image/gif,image/*;q=0.8",
}


class FotoInvalidaError(ValueError):
    """Imagen rechazada: no es foto, es demasiado grande o la URL no es segura."""


def _firma_imagen(raw: bytes) -> bool:
    if raw.startswith(_JPEG) or raw.startswith(_PNG) or raw.startswith(_GIF87) or raw.startswith(_GIF89):
        return True
    return len(raw) >= 12 and raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"


def _ip_bloqueada(ip: str) -> bool:
    addr = ipaddress.ip_address(ip)
    if isinstance(addr, ipaddress.IPv6Address) and addr.ipv4_mapped is not None:
        addr = addr.ipv4_mapped
    return bool(
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    )


def asegurar_url_remota(url: str) -> None:
    """Solo HTTPS a un host cuya resolución sea IP pública (anti-SSRF)."""
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise FotoInvalidaError("Solo se aceptan URLs https para fotos remotas.")
    if parsed.username or parsed.password:
        raise FotoInvalidaError("URL de imagen no permitida.")
    host = parsed.hostname
    if not host:
        raise FotoInvalidaError("URL de imagen inválida.")
    host_l = host.lower().rstrip(".")
    if host_l in {"localhost", "metadata.google.internal", "metadata"} or host_l.endswith(".internal"):
        raise FotoInvalidaError("URL de imagen no permitida.")
    puerto = parsed.port
    if puerto not in (None, 443):
        raise FotoInvalidaError("URL de imagen no permitida.")
    try:
        infos = socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
    except socket.gaierror as e:
        raise FotoInvalidaError("No se pudo resolver el host de la imagen.") from e
    if not infos:
        raise FotoInvalidaError("No se pudo resolver el host de la imagen.")
    for info in infos:
        ip = info[4][0]
        if _ip_bloqueada(ip):
            raise FotoInvalidaError("URL de imagen no permitida.")


class _RedirectSeguro(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        asegurar_url_remota(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def decodificar_data_url(data_url: str) -> Tuple[bytes, str]:
    if len(data_url) > settings.FOTO_MAX_BYTES * 2:
        raise FotoInvalidaError(
            f"La foto supera el máximo de {settings.FOTO_MAX_BYTES // (1024 * 1024)} MB."
        )
    if "," not in data_url:
        raise FotoInvalidaError("Data URL de imagen inválida.")
    header, b64data = data_url.split(",", 1)
    header_l = header.lower()
    if not header_l.startswith("data:image/"):
        raise FotoInvalidaError("El Data URL debe ser una imagen.")
    mime = "image/jpeg"
    if "png" in header_l:
        mime = "image/png"
    elif "webp" in header_l:
        mime = "image/webp"
    elif "gif" in header_l:
        mime = "image/gif"
    padding = (-len(b64data)) % 4
    if padding:
        b64data += "=" * padding
    try:
        raw = base64.b64decode(b64data, validate=False)
    except Exception as e:
        raise FotoInvalidaError("Data URL de imagen inválida.") from e
    return raw, mime


def validar_bytes_imagen(raw: bytes) -> bytes:
    if not raw:
        raise FotoInvalidaError("La foto está vacía.")
    if len(raw) > settings.FOTO_MAX_BYTES:
        raise FotoInvalidaError(
            f"La foto supera el máximo de {settings.FOTO_MAX_BYTES // (1024 * 1024)} MB."
        )
    if not _firma_imagen(raw):
        raise FotoInvalidaError("El archivo no es una imagen JPEG, PNG, GIF o WebP.")
    return raw


def rasterizar_jpeg(raw: bytes, max_dimension: int = 800, calidad: int = 80) -> bytes:
    """Decodifica píxeles y escribe un JPEG nuevo (tira políglotas, EXIF y chunks)."""
    validar_bytes_imagen(raw)
    try:
        with Image.open(io.BytesIO(raw)) as img:
            img.load()
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass
            img = img.convert("RGB")
            img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=calidad, optimize=True)
            return buf.getvalue()
    except Image.DecompressionBombError as e:
        raise FotoInvalidaError("La imagen declara un tamaño que no se puede procesar.") from e
    except FotoInvalidaError:
        raise
    except Exception as e:
        raise FotoInvalidaError("No se pudo procesar la imagen. Sube un JPEG o PNG válido.") from e


def leer_acotado(resp, max_bytes: Optional[int] = None) -> bytes:
    limite = max_bytes or settings.FOTO_MAX_BYTES
    partes = []
    total = 0
    while True:
        chunk = resp.read(64 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > limite:
            raise FotoInvalidaError("La foto remota supera el tamaño máximo.")
        partes.append(chunk)
    return b"".join(partes)


def descargar_https_publica(url: str, timeout: int = 15) -> Tuple[bytes, str]:
    asegurar_url_remota(url)
    opener = build_opener(_RedirectSeguro)
    req = Request(url, headers=_UA)
    try:
        with opener.open(req, timeout=timeout) as resp:
            asegurar_url_remota(resp.geturl())
            raw = leer_acotado(resp)
            ctype = resp.headers.get_content_type() or "image/jpeg"
    except FotoInvalidaError:
        raise
    except Exception as e:
        raise FotoInvalidaError(f"No se pudo descargar la imagen: {e}") from e
    validar_bytes_imagen(raw)
    return raw, ctype


def ruta_local_upload(url: str) -> str:
    nombre = os.path.basename(url.split("?")[0])
    return os.path.join(settings.UPLOAD_DIR, nombre)
