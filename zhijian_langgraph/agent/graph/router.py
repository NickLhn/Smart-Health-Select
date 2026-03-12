"""Graph 路由逻辑."""

from __future__ import annotations

from typing import TYPE_CHECKING

from agent.graph.nodes.intent import classify_intent

if TYPE_CHECKING:
    from agent.graph.states import GraphState


def route_by_intent(state) -> str:
    """根据意图路由到对应节点.
    
    Args:
        state: 当前状态
    
    Returns:
        目标节点名称
    """
    intent = state.get("intent") or classify_intent(state.get("message") or "")
    
    # 直接返回意图作为节点名称
    return intent


def should_end(state) -> str:
    """判断是否结束流程.
    
    如果已经有 reply，则结束。
    """
    if state.get("reply"):
        return "end"
    return "continue"
