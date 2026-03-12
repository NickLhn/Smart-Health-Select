"""管理员端 Graph 构建器."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from agent.admin.states import AdminGraphState
from agent.admin.router import route_by_intent
from agent.admin.nodes import (
    normalize_input_node,
    handle_pending_pick_node,
    query_flow_node,
    status_flow_node,
    merchant_flow_node,
    medicine_flow_node,
    order_flow_node,
    other_flow_node,
)


def build_admin_graph(settings=None):
    """构建管理员端 Graph."""
    workflow = StateGraph(AdminGraphState)
    
    # 添加节点
    workflow.add_node("normalize_input", normalize_input_node)
    workflow.add_node("handle_pending", handle_pending_pick_node)
    workflow.add_node("user_query", query_flow_node)
    workflow.add_node("user_status", status_flow_node)
    workflow.add_node("merchant", merchant_flow_node)
    workflow.add_node("medicine", medicine_flow_node)
    workflow.add_node("order", order_flow_node)
    workflow.add_node("other", other_flow_node)
    
    # 设置入口
    workflow.add_edge(START, "normalize_input")
    workflow.add_edge("normalize_input", "handle_pending")
    
    # 条件路由
    workflow.add_conditional_edges(
        "handle_pending",
        route_by_intent,
        {
            "USER_QUERY": "user_query",
            "USER_STATUS": "user_status",
            "MERCHANT": "merchant",
            "MEDICINE": "medicine",
            "ORDER": "order",
            "OTHER": "other",
        }
    )
    
    # 所有节点连接到 END
    for node in ["user_query", "user_status", "merchant", "medicine", "order", "other"]:
        workflow.add_edge(node, END)
    
    return workflow.compile()
