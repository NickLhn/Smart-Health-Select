import os
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    jwt_secret: str
    tools_base_url: str

    redis_host: str
    redis_port: int
    redis_db: int
    redis_password: str | None


def _read_backend_jwt_secret() -> str:
    project_root = Path(__file__).resolve().parents[2]
    jwt_util = project_root / "backend" / "zhijian-common" / "src" / "main" / "java" / "com" / "zhijian" / "common" / "util" / "JwtUtil.java"
    content = jwt_util.read_text(encoding="utf-8")
    match = re.search(r'SECRET_STRING\s*=\s*"([^"]+)"', content)
    if not match:
        raise RuntimeError("JwtUtil SECRET_STRING not found")
    return match.group(1).strip()


def load_settings() -> Settings:
    jwt_secret = os.environ.get("AGENT_JWT_SECRET", "").strip()
    if not jwt_secret:
        jwt_secret = _read_backend_jwt_secret()

    tools_base_url = os.environ.get("AGENT_TOOLS_BASE_URL", "").strip().rstrip("/")
    if not tools_base_url:
        raise RuntimeError("Missing AGENT_TOOLS_BASE_URL")

    redis_host = os.environ.get("AGENT_REDIS_HOST", "localhost").strip()
    redis_port_raw = os.environ.get("AGENT_REDIS_PORT", "6379").strip()
    redis_db_raw = os.environ.get("AGENT_REDIS_DB", "0").strip()
    redis_password = os.environ.get("AGENT_REDIS_PASSWORD", "").strip() or None

    try:
        redis_port = int(redis_port_raw)
        redis_db = int(redis_db_raw)
    except ValueError as exc:
        raise RuntimeError("Invalid AGENT_REDIS_PORT/AGENT_REDIS_DB") from exc

    return Settings(
        jwt_secret=jwt_secret,
        tools_base_url=tools_base_url,
        redis_host=redis_host,
        redis_port=redis_port,
        redis_db=redis_db,
        redis_password=redis_password,
    )
