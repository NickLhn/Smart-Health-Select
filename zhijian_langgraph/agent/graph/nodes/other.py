"""其他/默认流程节点."""

from __future__ import annotations

from typing import Any

from agent.graph.states import GraphState


def other_flow_node(state: GraphState) -> dict[str, Any]:
    """默认回复流程.
    
    当无法识别意图时，提供引导性回复。
    """
    return {
        "reply": "你可以问我：订单查询、退款进度、物流跟踪或用药咨询。"
    }
