"""商家端 Graph 路由."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.merchant.states import MerchantGraphState


def route_by_intent(state) -> str:
    """根据意图路由到对应节点."""
    return state.get("intent") or "OTHER"
