"""商家端数据看板节点."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from agent.merchant.states import MerchantGraphState
    from agent.tools_client import ToolsClient


def _build_tools_client(settings=None):
    from agent.tools_client import ToolsClient
    from agent.settings import load_settings
    if settings is None:
        settings = load_settings()
    return ToolsClient(settings)


def _error_reply(payload, fallback):
    if payload.get("success", True):
        return None
    status_code = payload.get("status_code")
    if status_code == 403:
        return {"reply": "无权限访问商家工具，请使用商家账号登录。"}
    if status_code == 401:
        return {"reply": "登录已过期，请重新登录后再试。"}
    if status_code == 404:
        return {"reply": fallback}
    return {"reply": "工具服务暂时不可用，请稍后再试。"}


def _time_range_from_text(text, default="today"):
    t = text or ""
    if "昨天" in t:
        return "yesterday"
    if "近7" in t or "最近7" in t or "一周" in t:
        return "last7"
    if "近30" in t or "最近30" in t or "一个月" in t or "30天" in t:
        return "last30"
    if "今天" in t or "今日" in t:
        return "today"
    return default


def dashboard_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """数据看板概览."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查看概览。"}
    
    tools = _build_tools_client(load_settings())
    tr = _time_range_from_text(state.get("message") or "", default="today")
    
    payload = tools.merchant_dashboard_summary(token, time_range=tr, request_id=request_id)
    err = _error_reply(payload, "暂无数据。")
    if err:
        return err
    
    data = payload.get("data") or {}
    reply = (
        f"概览（{data.get('timeRangeApplied', {}).get('type', tr)}）："
        f"支付订单 {data.get('ordersPaid', 0)}，"
        f"订单 {data.get('ordersTotal', 0)}，"
        f"GMV ¥{data.get('gmv') or '0.00'}，"
        f"客单价 ¥{data.get('aov') or '0.00'}，"
        f"退款 ¥{data.get('refundAmount') or '0.00'}（{data.get('refundCount', 0)}单），"
        f"待发货 {data.get('pendingShipCount', 0)}。"
    )
    return {"reply": reply}


def overview_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """经营概览."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查看经营概览。"}
    
    tools = _build_tools_client(load_settings())
    msg = state.get("message") or ""
    tr = state.get("time_range_override") or _time_range_from_text(msg, default="today")
    
    # 获取各项数据
    dash = tools.merchant_dashboard_summary(token, time_range=tr, request_id=request_id)
    err = _error_reply(dash, "暂无概览数据。")
    if err:
        return err
    dash_data = dash.get("data") or {}
    
    pending = tools.merchant_orders_pending_summary(token, request_id=request_id)
    pending_data = pending.get("data") or {} if pending.get("success", True) else {}
    
    refunds = tools.merchant_refunds_summary(
        token, 
        time_range=tr if tr in {"today", "yesterday"} else "last7", 
        request_id=request_id
    )
    refunds_data = refunds.get("data") or {} if refunds.get("success", True) else {}
    
    low = tools.merchant_inventory_low(token, threshold=7, limit=10, request_id=request_id)
    low_items = low.get("data", {}).get("items") or [] if low.get("success", True) else []
    
    lines = []
    lines.append(
        f"经营概览（{dash_data.get('timeRangeApplied', {}).get('type', tr)}）："
        f"订单 {dash_data.get('ordersTotal', 0)}，支付订单 {dash_data.get('ordersPaid', 0)}，"
        f"GMV ¥{dash_data.get('gmv') or '0.00'}，客单价 ¥{dash_data.get('aov') or '0.00'}。"
    )
    lines.append(
        f"履约：待发货 {pending_data.get('waitShip', dash_data.get('pendingShipCount', 0))}，"
        f"待审核 {pending_data.get('waitAudit', dash_data.get('pendingAuditCount', 0))}。"
    )
    lines.append(
        f"售后：退款 ¥{refunds_data.get('refundAmount') or dash_data.get('refundAmount') or '0.00'}"
        f"（{refunds_data.get('refundCount', dash_data.get('refundCount', 0))}单）。"
    )
    
    if not low_items:
        lines.append("库存：暂无库存≤7的商品。")
    else:
        top = "；".join(f"{it.get('name')}({it.get('stock')})" for it in low_items[:5] if isinstance(it, dict))
        lines.append(f"库存：低库存≤7（前5）{top}。")
    
    return {"reply": "\n".join(lines)}
