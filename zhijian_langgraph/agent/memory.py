from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Optional

import redis

from agent.settings import Settings


@dataclass(frozen=True)
class RedisKeys:
    history_key: str
    state_key: str


def build_keys(conversation_id: str) -> RedisKeys:
    return RedisKeys(
        history_key=f"chat:history:{conversation_id}",
        state_key=f"chat:state:{conversation_id}",
    )


def get_redis(settings: Settings) -> redis.Redis:
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        db=settings.redis_db,
        password=settings.redis_password,
        decode_responses=True,
        socket_timeout=3,
        socket_connect_timeout=3,
    )


def append_history(r: redis.Redis, keys: RedisKeys, item: Dict[str, Any], ttl_seconds: int) -> None:
    r.rpush(keys.history_key, json.dumps(item, ensure_ascii=False))
    r.expire(keys.history_key, ttl_seconds)


def load_state(r: redis.Redis, keys: RedisKeys) -> Dict[str, Any]:
    raw = r.get(keys.state_key)
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def save_state(r: redis.Redis, keys: RedisKeys, state: Dict[str, Any], ttl_seconds: int) -> None:
    r.set(keys.state_key, json.dumps(state, ensure_ascii=False))
    r.expire(keys.state_key, ttl_seconds)


def load_recent_history(r: redis.Redis, keys: RedisKeys, limit: int) -> list[Dict[str, Any]]:
    raw_items = r.lrange(keys.history_key, max(0, -limit), -1)
    items: list[Dict[str, Any]] = []
    for raw in raw_items:
        try:
            items.append(json.loads(raw))
        except json.JSONDecodeError:
            continue
    return items
