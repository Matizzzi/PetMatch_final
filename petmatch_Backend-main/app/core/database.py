import uuid

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# En Neon (Postgres serverless) es muy importante pool_pre_ping=True para reconectar si la conexión se duerme
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_id(prefix: str = "c") -> str:
    """Genera un identificador único en formato similar a cuid/uuid string."""
    return f"{prefix}{uuid.uuid4().hex[:24]}"


def asegurar_esquema() -> None:
    """Agrega columnas nuevas a tablas ya existentes (create_all no altera)."""
    inspector = inspect(engine)
    if "alertas_perdida" not in inspector.get_table_names():
        return
    columnas = {c["name"] for c in inspector.get_columns("alertas_perdida")}
    if "codigoCierreHash" in columnas:
        return
    with engine.begin() as conn:
        conn.execute(text('ALTER TABLE alertas_perdida ADD COLUMN "codigoCierreHash" VARCHAR'))
