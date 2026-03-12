"""商家端库存管理节点."""

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


def _has_explicit_time_range(text):
    t = text or ""
    return any(k in t for k in ["今天", "今日", "昨天", "近7", "最近7", "一周", "近30", "最近30", "30天", "一个月"])


def inventory_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """库存风险查询."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查看库存。"}
    
    tools = _build_tools_client(load_settings())
    
    payload = tools.merchant_inventory_low(token, threshold=7, limit=20, request_id=request_id)
    err = _error_reply(payload, "暂无库存数据。")
    if err:
        return err
    
    data = payload.get("data") or {}
    items = data.get("items") or []
    if not items:
        return {"reply": "当前没有库存≤7的商品。"}
    
    lines = ["库存风险（库存≤7）建议补货："]
    for i, it in enumerate(items[:10], start=1):
        lines.append(f"{i}）{it.get('name')} 库存{it.get('stock')}，建议补{it.get('suggestQty')}")
    if len(items) > 10:
        lines.append(f"（共{len(items)}个，已展示前10个）")
    
    return {"reply": "\n".join(lines)}


def inventory_forecast_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """库存预测."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法做库存预测。"}
    
    tools = _build_tools_client(load_settings())
    
    msg = state.get("message") or ""
    tr = state.get("time_range_override") or (_time_range_from_text(msg, default="last30") if _has_explicit_time_range(msg) else "last30")
    
    payload = tools.merchant_inventory_forecast(
        token,
        time_range=tr,
        low_stock_threshold=20,
        target_days=14,
        limit=20,
        request_id=request_id,
    )
    err = _error_reply(payload, "暂无库存预测数据。")
    if err:
        return err
    
    data = payload.get("data") or {}
    items = data.get("items") or []
    if not items:
        return {"reply": "暂无可用的库存预测数据。"}
    
    risk_items = [it for it in items if isinstance(it, dict) and it.get("riskLevel") in {"CRITICAL", "WARN"}]
    show = risk_items[:10] if risk_items else items[:10]
    
    lines = [f"库存可售天数（{tr}口径）：重点关注（前{len(show)}）"]
    cards = []
    
    for i, it in enumerate(show, start=1):
        name = it.get("name")
        stock = it.get("stock")
        dos = it.get("daysOfSupply")
        avg = it.get("avgDailySales")
        risk = it.get("riskLevel")
        rec = it.get("recommendReplenishQty")
        dos_text = "未知" if dos is None else f"{dos}天"
        
        lines.append(f"{i}）{name}｜库存{stock}｜可售{dos_text}｜日均{avg}｜建议补{rec}｜{risk}；")
        cards.append({
            "type": "inventory_forecast",
            "id": f"inv:{it.get('productId')}",
            "title": str(name or ""),
            "subtitle": f"库存{stock}｜可售{dos_text}｜{risk}",
            "productId": it.get("productId"),
            "stock": stock,
            "daysOfSupply": dos,
            "avgDailySales": avg,
            "recommendReplenishQty": rec,
            "riskLevel": risk,
        })
    
    return {"reply": "\n".join(lines), "cards": cards}
