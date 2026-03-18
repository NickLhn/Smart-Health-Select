from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional

import redis

from agent.settings import Settings, load_settings


@dataclass(frozen=True)
class RedisKeys:
    history_key: str
    state_key: str


PROFILE_KEY_PREFIX = "user:profile:"
PROFILE_TTL = 90 * 24 * 60 * 60


def build_keys(conversation_id: str) -> RedisKeys:
    return RedisKeys(
        history_key=f"chat:history:{conversation_id}",
        state_key=f"chat:state:{conversation_id}",
    )


def build_profile_key(user_id: str) -> str:
    return f"{PROFILE_KEY_PREFIX}{user_id}"


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


def save_user_profile(r: redis.Redis, user_id: str, profile: Dict[str, Any], ttl: int = PROFILE_TTL) -> None:
    profile["last_updated"] = datetime.now().isoformat()
    r.set(
        build_profile_key(user_id),
        json.dumps(profile, ensure_ascii=False),
        ex=ttl
    )


def load_user_profile(r: redis.Redis, user_id: str) -> Optional[Dict[str, Any]]:
    raw = r.get(build_profile_key(user_id))
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def merge_user_profile(r: redis.Redis, user_id: str, new_data: Dict[str, Any]) -> Dict[str, Any]:
    existing = load_user_profile(r, user_id) or {
        "user_id": user_id,
        "preferences": {},
        "attributes": {},
        "extracted_at": None
    }
    
    for key in ["preferences", "attributes"]:
        if key in new_data:
            existing[key] = {**existing.get(key, {}), **new_data[key]}
    
    existing["extracted_at"] = datetime.now().isoformat()
    save_user_profile(r, user_id, existing)
    return existing


SUMMARY_KEY_PREFIX = "chat:summary:"
SUMMARY_TTL = 7 * 24 * 60 * 60


def build_summary_key(conversation_id: str) -> str:
    return f"{SUMMARY_KEY_PREFIX}{conversation_id}"


def save_conversation_summary(r: redis.Redis, conversation_id: str, summary: Dict[str, Any], ttl: int = SUMMARY_TTL) -> None:
    r.set(
        build_summary_key(conversation_id),
        json.dumps(summary, ensure_ascii=False),
        ex=ttl
    )


def load_conversation_summary(r: redis.Redis, conversation_id: str) -> Optional[Dict[str, Any]]:
    raw = r.get(build_summary_key(conversation_id))
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


USER_SUMMARIES_KEY_PREFIX = "user:summaries:"


def build_user_summaries_key(user_id: str) -> str:
    return f"{USER_SUMMARIES_KEY_PREFIX}{user_id}"


def append_user_summary(r: redis.Redis, user_id: str, summary_text: str, ttl: int = PROFILE_TTL) -> None:
    key = build_user_summaries_key(user_id)
    r.lpush(key, summary_text)
    r.ltrim(key, 0, 9)
    r.expire(key, ttl)


def load_user_summaries(r: redis.Redis, user_id: str, limit: int = 5) -> list:
    key = build_user_summaries_key(user_id)
    return r.lrange(key, 0, limit - 1)
