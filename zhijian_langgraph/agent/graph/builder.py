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
)


def build_graph(settings=None) -> StateGraph:
    """构建用户端 Graph.
    
    流程：
    START -> normalize -> handle_pending -> [条件路由] -> 业务节点 -> END
    
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
    workflow.add_node("order_flow", order_flow_node)
    workflow.add_node("refund_flow", refund_flow_node)
    workflow.add_node("shipping_flow", shipping_flow_node)
    workflow.add_node("medical_flow", medical_flow_node)
    workflow.add_node("medicine_flow", medicine_flow_node)
    workflow.add_node("purchase_flow", purchase_flow_node)
    workflow.add_node("other_flow", other_flow_node)
    
    # 设置入口
    workflow.add_edge(START, "normalize_input")
    workflow.add_edge("normalize_input", "handle_pending")
    
    # 条件路由
    workflow.add_conditional_edges(
        "handle_pending",
        route_by_intent,
        {
            "ORDER": "order_flow",
            "REFUND": "refund_flow",
            "SHIPPING": "shipping_flow",
            "MEDICAL": "medical_flow",
            "MEDICINE": "medicine_flow",
            "PURCHASE": "purchase_flow",
            "OTHER": "other_flow",
        }
    )
    
    # 所有业务节点都连接到 END
    workflow.add_edge("order_flow", END)
    workflow.add_edge("refund_flow", END)
    workflow.add_edge("shipping_flow", END)
    workflow.add_edge("medical_flow", END)
    workflow.add_edge("medicine_flow", END)
    workflow.add_edge("purchase_flow", END)
    workflow.add_edge("other_flow", END)
    
    return workflow.compile()
