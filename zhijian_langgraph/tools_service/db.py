from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Dict, Iterator, Optional

import pymysql
from pymysql.cursors import DictCursor

from tools_service.settings import Settings


def _connect(settings: Settings) -> pymysql.connections.Connection:
    return pymysql.connect(
        host=settings.mysql_host,
        port=settings.mysql_port,
        user=settings.mysql_user,
        password=settings.mysql_password,
        database=settings.mysql_db,
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=True,
        read_timeout=10,
        write_timeout=10,
        connect_timeout=5,
    )


@contextmanager
def get_conn(settings: Settings) -> Iterator[pymysql.connections.Connection]:
    conn = _connect(settings)
    try:
        yield conn
    finally:
        conn.close()


def fetch_one(conn: pymysql.connections.Connection, sql: str, args: Optional[tuple[Any, ...]] = None) -> Optional[Dict[str, Any]]:
    with conn.cursor() as cursor:
        cursor.execute(sql, args or ())
        row = cursor.fetchone()
        return row


def fetch_all(conn: pymysql.connections.Connection, sql: str, args: Optional[tuple[Any, ...]] = None) -> list[Dict[str, Any]]:
    with conn.cursor() as cursor:
        cursor.execute(sql, args or ())
        rows = cursor.fetchall()
        return list(rows or [])
