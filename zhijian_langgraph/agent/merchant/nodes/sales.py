"""商家端销售分析节点."""

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


def _time_range_from_text(text, default="last7"):
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


def sales_trend_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """销售趋势."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查看销售趋势。"}
    
    tools = _build_tools_client(load_settings())
    
    tr = _time_range_from_text(state.get("message") or "", default="last7")
    
    payload = tools.merchant_sales_trend(token, time_range=tr, request_id=request_id)
    err = _error_reply(payload, "暂无销售趋势数据。")
    if err:
        return err
    
    data = payload.get("data") or {}
    points = data.get("points") or []
    
    if not points:
        return {"reply": "暂无销售趋势数据。"}
    
    lines = [f"销售趋势（{tr}）："]
    for p in points[-7:]:  # 最近7个点
        lines.append(f"{p.get('date')}: 订单{p.get('orders', 0)} GMV¥{p.get('gmv', '0.00')}")
    
    return {"reply": "\n".join(lines)}


def top_products_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """热销排行."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查看热销排行。"}
    
    tools = _build_tools_client(load_settings())
    
    tr = _time_range_from_text(state.get("message") or "", default="last7")
    
    payload = tools.merchant_top_products(token, time_range=tr, limit=10, request_id=request_id)
    err = _error_reply(payload, "暂无热销数据。")
    if err:
        return err
    
    data = payload.get("data") or {}
    items = data.get("items") or []
    
    if not items:
        return {"reply": "暂无热销数据。"}
    
    lines = [f"热销排行（{tr}，前10）："]
    for i, it in enumerate(items[:10], start=1):
        lines.append(f"{i}. {it.get('name')} 销量{it.get('sales')} GMV¥{it.get('gmv')}")
    
    return {"reply": "\n".join(lines)}
