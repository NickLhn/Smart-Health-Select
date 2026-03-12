"""商家端 Graph 构建器."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from agent.merchant.states import MerchantGraphState
from agent.merchant.router import route_by_intent
from agent.merchant.nodes import (
    normalize_input_node,
    handle_pending_pick_node,
    medicine_flow_node,
    dashboard_flow_node,
    overview_flow_node,
    inventory_flow_node,
    inventory_forecast_flow_node,
    diagnosis_flow_node,
    compliance_flow_node,
    conversion_flow_node,
    orders_pending_flow_node,
    orders_list_flow_node,
    order_detail_flow_node,
    refund_list_flow_node,
    refund_summary_flow_node,
    sales_trend_flow_node,
    top_products_flow_node,
    other_flow_node,
)


def build_merchant_graph(settings=None):
    """构建商家端 Graph."""
    workflow = StateGraph(MerchantGraphState)
    
    # 添加节点
    workflow.add_node("normalize_input", normalize_input_node)
    workflow.add_node("handle_pending", handle_pending_pick_node)
    workflow.add_node("medicine_flow", medicine_flow_node)
    workflow.add_node("dashboard_flow", dashboard_flow_node)
    workflow.add_node("overview_flow", overview_flow_node)
    workflow.add_node("inventory_flow", inventory_flow_node)
    workflow.add_node("inventory_forecast_flow", inventory_forecast_flow_node)
    workflow.add_node("diagnosis_flow", diagnosis_flow_node)
    workflow.add_node("compliance_flow", compliance_flow_node)
    workflow.add_node("conversion_flow", conversion_flow_node)
    workflow.add_node("orders_pending_flow", orders_pending_flow_node)
    workflow.add_node("orders_list_flow", orders_list_flow_node)
    workflow.add_node("order_detail_flow", order_detail_flow_node)
    workflow.add_node("refund_list_flow", refund_list_flow_node)
    workflow.add_node("refund_summary_flow", refund_summary_flow_node)
    workflow.add_node("sales_trend_flow", sales_trend_flow_node)
    workflow.add_node("top_products_flow", top_products_flow_node)
    workflow.add_node("other_flow", other_flow_node)
    
    # 设置入口
    workflow.add_edge(START, "normalize_input")
    workflow.add_edge("normalize_input", "handle_pending")
    
    # 条件路由
    workflow.add_conditional_edges(
        "handle_pending",
        route_by_intent,
        {
            "MEDICINE_MGMT": "medicine_flow",
            "DASHBOARD_SUMMARY": "dashboard_flow",
            "SHOP_OVERVIEW": "overview_flow",
            "INVENTORY_RISK": "inventory_flow",
            "INVENTORY_FORECAST": "inventory_forecast_flow",
            "DIAGNOSIS": "diagnosis_flow",
            "COMPLIANCE_QA": "compliance_flow",
            "CONVERSION_ADVICE": "conversion_flow",
            "ORDERS_PENDING": "orders_pending_flow",
            "ORDERS_LIST": "orders_list_flow",
            "ORDER_DETAIL": "order_detail_flow",
            "REFUND_LIST": "refund_list_flow",
            "REFUND_SUMMARY": "refund_summary_flow",
            "SALES_TREND": "sales_trend_flow",
            "TOP_PRODUCTS": "top_products_flow",
            "OTHER": "other_flow",
        }
    )
    
    # 所有节点连接到 END
    for node in [
        "medicine_flow", "dashboard_flow", "overview_flow",
        "inventory_flow", "inventory_forecast_flow", "diagnosis_flow",
        "compliance_flow", "conversion_flow", "orders_pending_flow",
        "orders_list_flow", "order_detail_flow", "refund_list_flow",
        "refund_summary_flow", "sales_trend_flow", "top_products_flow",
        "other_flow",
    ]:
        workflow.add_edge(node, END)
    
    return workflow.compile()
