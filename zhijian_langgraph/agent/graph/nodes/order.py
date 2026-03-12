"""订单流程节点."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from agent.utils import extract_pick_index
from agent.graph.formatters import OrderFormatter

if TYPE_CHECKING:
    from agent.graph.states import GraphState
    from agent.tools_client import ToolsClient


def _build_tools_client(settings: Any) -> "ToolsClient":
    """构建工具客户端（延迟导入避免循环依赖）."""
    from agent.tools_client import ToolsClient
    from agent.settings import load_settings
    if settings is None:
        settings = load_settings()
    return ToolsClient(settings)


def _error_reply(payload: dict[str, Any], not_found_reply: str) -> dict[str, Any] | None:
    """处理工具错误响应."""
    if payload.get("success", True):
        return None
    status_code = payload.get("status_code")
    if status_code == 404:
        return {"reply": not_found_reply}
    return {"reply": "工具服务暂时不可用，请稍后再试。"}


def order_flow_node(state: "GraphState") -> dict[str, Any]:
    """订单查询流程.
    
    处理：
    1. 列表查询（无订单号）
    2. 详情查询（有订单号）
    3. 列表选择（pending_action=ORDER_PICK）
    """
    from agent.settings import load_settings
    
    user_token = state.get("token") or ""
    request_id = state.get("request_id") or None
    
    if not user_token:
        return {"reply": "缺少登录token，无法查询订单。"}
    
    tools = _build_tools_client(load_settings())
    formatter = OrderFormatter()
    
    # 处理列表选择状态
    if state.get("pending_action") == "ORDER_PICK":
        idx = extract_pick_index(state.get("message") or "")
        candidates = state.get("candidates") or []
        if idx is not None and candidates and idx > len(candidates):
            return {"reply": f"序号无效，请输入 1-{len(candidates)}。"}
    
    order_no = state.get("order_no")
    
    # 有订单号 -> 查详情
    if order_no:
        return _query_order_detail(tools, user_token, order_no, request_id, formatter)
    
    # 无订单号 -> 查列表
    return _query_order_list(tools, user_token, request_id, formatter)


def _query_order_detail(
    tools: "ToolsClient",
    user_token: str,
    order_no: str,
    request_id: str | None,
    formatter: OrderFormatter,
) -> dict[str, Any]:
    """查询订单详情."""
    payload = tools.get_order_detail(user_token, order_no, request_id=request_id)
    
    err = _error_reply(payload, "未找到该订单。")
    if err:
        return err
    
    data = payload.get("data") or {}
    order = data.get("order") or {}
    items = data.get("items") or []
    
    reply = formatter.format_detail(order, items)
    return {"reply": reply}


def _query_order_list(
    tools: "ToolsClient",
    user_token: str,
    request_id: str | None,
    formatter: OrderFormatter,
) -> dict[str, Any]:
    """查询订单列表."""
    payload = tools.get_recent_orders(user_token, limit=5, request_id=request_id)
    
    err = _error_reply(payload, "暂时没有查到你的订单。")
    if err:
        return err
    
    items = (payload.get("data") or {}).get("items") or []
    if not items:
        return {"reply": "暂时没有查到你的订单。"}
    
    # 构建候选列表
    candidates = []
    lines = ["我需要你选择要查询的订单（回复序号即可，也可以直接回复订单号）："]
    
    for i, it in enumerate(items, start=1):
        lines.append(formatter.format_list_item(it, i))
        candidates.append({
            "selectKey": it.get("selectKey"),
            "orderNo": it.get("selectKey"),
        })
    
    return {
        "pending_action": "ORDER_PICK",
        "candidates": candidates,
        "reply": "\n".join(lines),
    }
