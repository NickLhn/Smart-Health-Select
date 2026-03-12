"""商家端退款管理节点."""

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


def refund_list_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """退款列表."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查询退款。"}
    
    tools = _build_tools_client(load_settings())
    
    # 获取退款列表
    payload = tools.merchant_refunds_list(token, status="ALL", time_range="last30", page=1, page_size=10, request_id=request_id)
    err = _error_reply(payload, "暂无退款数据。")
    if err:
        return err
    
    data = payload.get("data") or {}
    items = data.get("items") or []
    if not items:
        return {"reply": "暂无退款记录。"}
    
    lines = [f"共 {len(items)} 条退款记录："]
    for i, it in enumerate(items[:10], start=1):
        lines.append(f"{i}. 订单{it.get('orderNo')} 金额¥{it.get('amount')} 状态{it.get('statusText')}")
    
    return {"reply": "\n".join(lines)}


def refund_summary_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """退款汇总."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查询退款汇总。"}
    
    tools = _build_tools_client(load_settings())
    
    payload = tools.merchant_refunds_summary(token, time_range="last30", request_id=request_id)
    err = _error_reply(payload, "暂无退款数据。")
    if err:
        return err
    
    data = payload.get("data") or {}
    reply = (
        f"退款汇总（近30天）："
        f"退款金额 ¥{data.get('refundAmount') or '0.00'}，"
        f"退款订单 {data.get('refundCount', 0)} 单，"
        f"退款率 {data.get('refundRate') or '0%'}。"
    )
    return {"reply": reply}
