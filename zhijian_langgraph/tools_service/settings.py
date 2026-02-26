import os
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    jwt_secret: str

    mysql_host: str
    mysql_port: int
    mysql_user: str
    mysql_password: str
    mysql_db: str
    backend_base_url: str

    service_name: str = "tools-service"


def _read_backend_jwt_secret() -> str:
    project_root = Path(__file__).resolve().parents[2]
    jwt_util = project_root / "backend" / "zhijian-common" / "src" / "main" / "java" / "com" / "zhijian" / "common" / "util" / "JwtUtil.java"
    content = jwt_util.read_text(encoding="utf-8")
    match = re.search(r'SECRET_STRING\s*=\s*"([^"]+)"', content)
    if not match:
        raise RuntimeError("JwtUtil SECRET_STRING not found")
    return match.group(1).strip()


def load_settings() -> Settings:
    jwt_secret = os.environ.get("TOOLS_JWT_SECRET", "").strip()
    if not jwt_secret:
        jwt_secret = _read_backend_jwt_secret()

    mysql_host = os.environ.get("TOOLS_MYSQL_HOST", "").strip()
    mysql_user = os.environ.get("TOOLS_MYSQL_USER", "").strip()
    mysql_password = os.environ.get("TOOLS_MYSQL_PASSWORD", "")
    mysql_db = os.environ.get("TOOLS_MYSQL_DB", "").strip()
    mysql_port_raw = os.environ.get("TOOLS_MYSQL_PORT", "3306").strip()
    backend_base_url = os.environ.get("TOOLS_BACKEND_BASE_URL", "http://127.0.0.1:8080/api").strip().rstrip("/")

    if not mysql_host:
        raise RuntimeError("Missing TOOLS_MYSQL_HOST")
    if not mysql_user:
        raise RuntimeError("Missing TOOLS_MYSQL_USER")
    if not mysql_db:
        raise RuntimeError("Missing TOOLS_MYSQL_DB")

    try:
        mysql_port = int(mysql_port_raw)
    except ValueError as exc:
        raise RuntimeError("Invalid TOOLS_MYSQL_PORT") from exc

    return Settings(
        jwt_secret=jwt_secret,
        mysql_host=mysql_host,
        mysql_port=mysql_port,
        mysql_user=mysql_user,
        mysql_password=mysql_password,
        mysql_db=mysql_db,
        backend_base_url=backend_base_url,
    )
