from __future__ import annotations

from typing import Any

from agent.graph.states import GraphState
from agent.memory import get_redis, load_user_profile, load_settings


def context_node(state: GraphState) -> dict[str, Any]:
    user_id = state.get("user_id") or state.get("token")
    if not user_id:
        return {}

    settings = load_settings()
    r = get_redis(settings)
    profile = load_user_profile(r, user_id)

    return {"user_profile": profile}
