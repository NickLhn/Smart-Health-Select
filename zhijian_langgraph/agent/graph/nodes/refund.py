"""退款流程节点."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from agent.utils import extract_pick_index
from agent.graph.formatters import RefundFormatter

if TYPE_CHECKING:
    from agent.graph.states import GraphState
    from agent.tools_client import ToolsClient


def _build_tools_client(settings: Any = None) -> "ToolsClient":
    """构建工具客户端."""
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


def refund_flow_node(state: "GraphState") -> dict[str, Any]:
    """退款查询流程."""
    from agent.settings import load_settings
    
    user_token = state.get("token") or ""
    request_id = state.get("request_id") or None
    
    if not user_token:
        return {"reply": "缺少登录token，无法查询退款。"}
    
    tools = _build_tools_client(load_settings())
    formatter = RefundFormatter()
    
    # 处理列表选择状态
    if state.get("pending_action") == "REFUND_PICK":
        idx = extract_pick_index(state.get("message") or "")
        candidates = state.get("candidates") or []
        if idx is not None and candidates and idx > len(candidates):
            return {"reply": f"序号无效，请输入 1-{len(candidates)}。"}
    
    order_no = state.get("order_no")
    
    # 有订单号 -> 查详情
    if order_no:
        return _query_refund_detail(tools, user_token, order_no, request_id, formatter)
    
    # 无订单号 -> 查列表
    return _query_refund_list(tools, user_token, request_id, formatter)


def _query_refund_detail(
    tools: "ToolsClient",
    user_token: str,
    order_no: str,
    request_id: str | None,
    formatter: RefundFormatter,
) -> dict[str, Any]:
    """查询退款详情."""
    payload = tools.get_refund_status(user_token, order_no, request_id=request_id)
    
    err = _error_reply(payload, "未找到该订单或退款申请。")
    if err:
        return err
    
    data = payload.get("data") or {}
    refund_apply = data.get("refundApply") or {}
    summary = data.get("summary") or {}
    
    # 格式化基本信息
    lines = [formatter.format_detail(refund_apply, summary)]
    
    # 格式化退款流水
    refund_payments = data.get("refundPayments") or []
    if refund_payments:
        lines.extend(formatter.format_payment_list(refund_payments))
    
    # 添加下一步提示
    tip = formatter.next_step_tip(refund_apply, summary)
    if tip:
        lines.append(f"提示：{tip}")
    
    return {"reply": "\n".join(lines)}


def _query_refund_list(
    tools: "ToolsClient",
    user_token: str,
    request_id: str | None,
    formatter: RefundFormatter,
) -> dict[str, Any]:
    """查询退款列表."""
    payload = tools.get_recent_refunds(user_token, limit=3, request_id=request_id)
    
    err = _error_reply(payload, "暂时没有查到你的退款记录。")
    if err:
        return err
    
    items = (payload.get("data") or {}).get("items") or []
    if not items:
        return {"reply": "暂时没有查到你的退款记录。"}
    
    # 构建候选列表
    candidates = []
    lines = ["我需要你选择要查询的退款记录（回复序号即可）："]
    
    for i, it in enumerate(items, start=1):
        lines.append(formatter.format_list_item(it, i))
        candidates.append({
            "selectKey": it.get("selectKey"),
            "orderNo": it.get("orderNo"),
        })
    
    return {
        "pending_action": "REFUND_PICK",
        "candidates": candidates,
        "reply": "\n".join(lines),
    }
