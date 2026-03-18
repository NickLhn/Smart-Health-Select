"""Graph 构建器.

将各个节点组装成完整的 Graph。
"""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from agent.graph.states import GraphState
from agent.graph.router import route_by_intent
from agent.graph.nodes import (
    normalize_input_node,
    handle_pending_pick_node,
    order_flow_node,
    refund_flow_node,
    shipping_flow_node,
    medical_flow_node,
    medicine_flow_node,
    purchase_flow_node,
    other_flow_node,
    profile_node,
    context_node,
    summary_node,
)


def build_graph(settings=None) -> StateGraph:
    """构建用户端 Graph.
    
    流程：
    START -> normalize -> handle_pending -> profile -> context -> [条件路由] -> 业务节点 -> summary -> END
    
    Args:
        settings: 配置（保留参数，实际从 state 中获取）
    
    Returns:
        编译后的 StateGraph
    """
    # 创建 Graph
    workflow = StateGraph(GraphState)
    
    # 添加节点
    workflow.add_node("normalize_input", normalize_input_node)
    workflow.add_node("handle_pending", handle_pending_pick_node)
    workflow.add_node("profile", profile_node)
    workflow.add_node("context", context_node)
    workflow.add_node("order_flow", order_flow_node)
    workflow.add_node("refund_flow", refund_flow_node)
    workflow.add_node("shipping_flow", shipping_flow_node)
    workflow.add_node("medical_flow", medical_flow_node)
    workflow.add_node("medicine_flow", medicine_flow_node)
    workflow.add_node("purchase_flow", purchase_flow_node)
    workflow.add_node("other_flow", other_flow_node)
    workflow.add_node("summary", summary_node)
    
    # 设置入口
    workflow.add_edge(START, "normalize_input")
    workflow.add_edge("normalize_input", "handle_pending")
    workflow.add_edge("handle_pending", "profile")
    workflow.add_edge("profile", "context")
    
    # 条件路由
    workflow.add_conditional_edges(
        "context",
        route_by_intent,
        {
            "ORDER": "order_flow",       # 订单流程
            "REFUND": "refund_flow",     # 退款流程
            "SHIPPING": "shipping_flow", # 物流流程
            "MEDICAL": "medical_flow",   # 问诊流程
            "MEDICINE": "medicine_flow", # 药品流程
            "PURCHASE": "purchase_flow", # 购买流程
            "OTHER": "other_flow",       # 其他
        }
    )
    
    # 所有业务节点连接到摘要节点
    workflow.add_edge("order_flow", "summary")
    workflow.add_edge("refund_flow", "summary")
    workflow.add_edge("shipping_flow", "summary")
    workflow.add_edge("medical_flow", "summary")
    workflow.add_edge("medicine_flow", "summary")
    workflow.add_edge("purchase_flow", "summary")
    workflow.add_edge("other_flow", "summary")
    
    workflow.add_edge("summary", END)
    
    return workflow.compile()
