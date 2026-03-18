from __future__ import annotations

from typing import Any, Optional

from agent.graph.states import GraphState
from agent.memory import get_redis, load_user_profile, merge_user_profile, load_settings


PROFILE_EXTRACT_RULES = {
    "payment_method": ["花呗", "微信", "支付宝", "银行卡", "货到付款"],
    "shipping_address": ["地址", "送到", "发货到"],
    "contact_preference": ["电话", "短信", "微信"],
    "medicine_types": ["感冒", "发烧", "咳嗽", "消炎", "维生素", "钙片", "胃药"],
}


def extract_profile_from_message(message: str, history: list[dict]) -> dict[str, Any]:
    extracted = {"preferences": {}, "attributes": {}}
    message_lower = message.lower()

    for pref_key, keywords in PROFILE_EXTRACT_RULES.items():
        for keyword in keywords:
            if keyword in message_lower:
                extracted["preferences"][pref_key] = keyword
                break

    if history:
        extracted["attributes"]["message_count"] = len(history)

    return extracted


def profile_node(state: GraphState) -> dict[str, Any]:
    user_id = state.get("user_id") or state.get("token")
    if not user_id:
        return {}

    settings = load_settings()
    r = get_redis(settings)
    message = state.get("message", "")
    history = state.get("history", [])

    new_profile_data = extract_profile_from_message(message, history)

    if new_profile_data.get("preferences") or new_profile_data.get("attributes"):
        merge_user_profile(r, user_id, new_profile_data)

    return {}
