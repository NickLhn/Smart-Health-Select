"""商家端订单管理节点."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from agent.utils import extract_pick_index

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


def orders_pending_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """待处理订单."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查询订单。"}
    
    tools = _build_tools_client(load_settings())
    
    if state.get("pending_action") == "PENDING_PICK":
        idx = extract_pick_index(state.get("message") or "")
        if idx is None:
            return {"pending_action": "PENDING_PICK", "reply": "请回复 1待发货/2待审核/3售后。"}
        if idx not in {1, 2, 3}:
            return {"pending_action": "PENDING_PICK", "reply": "请回复 1待发货/2待审核/3售后。"}
        
        if idx == 3:
            # 查询售后
            refunds = tools.merchant_refunds_list(token, status="PENDING", time_range="last30", page=1, page_size=10, request_id=request_id)
            if not refunds.get("success", True):
                return {"reply": "查询售后失败，请稍后再试。"}
            data = refunds.get("data") or {}
            items = data.get("items") or []
            if not items:
                return {"pending_action": None, "reply": "当前没有待处理售后/退款。"}
            
            candidates = []
            lines = ["待处理售后/退款（回复序号可查看详情）："]
            for i2, it in enumerate(items, start=1):
                candidates.append({
                    "type": "refund",
                    "refundNo": str(it.get("refundNo") or ""),
                    "orderNo": str(it.get("orderNo") or ""),
                })
                lines.append(f"{i2}. {it.get('displayTitle')}")
            return {"pending_action": None, "candidates": candidates, "reply": "\n".join(lines)}
        
        # 1=待发货, 2=待审核
        status_map = {1: "WAIT_SHIP", 2: "WAIT_AUDIT"}
        return _query_orders_by_status(tools, token, status_map[idx], request_id)
    
    # 首次询问
    return {
        "pending_action": "PENDING_PICK",
        "reply": "看哪类待处理事项？回复：1待发货；2待审核；3售后",
    }


def orders_list_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """订单列表."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查询订单。"}
    
    tools = _build_tools_client(load_settings())
    
    # 根据关键词判断状态
    msg = state.get("message") or ""
    status = "ALL"
    if "待支付" in msg:
        status = "WAIT_PAY"
    elif "待发货" in msg:
        status = "WAIT_SHIP"
    elif "已发货" in msg:
        status = "SHIPPED"
    elif "已完成" in msg:
        status = "COMPLETED"
    elif "售后" in msg or "退款" in msg:
        status = "AFTERSALES"
    
    return _query_orders_by_status(tools, token, status, request_id)


def order_detail_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """订单详情."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法查询订单。"}
    
    tools = _build_tools_client(load_settings())
    
    # 提取订单号
    order_no = state.get("order_no")
    if not order_no:
        return {"reply": "请提供订单号。"}
    
    payload = tools.merchant_order_detail(token, order_no=order_no, request_id=request_id)
    err = _error_reply(payload, "未找到该订单。")
    if err:
        return err
    
    data = payload.get("data") or {}
    # 简化展示
    lines = [
        f"订单号：{data.get('orderNo')}",
        f"状态：{data.get('statusText')}",
        f"金额：¥{data.get('payAmount') or '0.00'}",
        f"下单时间：{data.get('createTime')}",
        f"收货人：{data.get('receiverName')}",
    ]
    return {"reply": "\n".join(lines)}


def _query_orders_by_status(tools, token, status, request_id):
    """按状态查询订单列表."""
    payload = tools.merchant_orders_list(token, status=status, page=1, page_size=10, request_id=request_id)
    err = _error_reply(payload, "暂无订单。")
    if err:
        return err
    
    data = payload.get("data") or {}
    items = data.get("items") or []
    if not items:
        return {"reply": f"暂无{status}订单。"}
    
    lines = [f"共 {len(items)} 条订单："]
    for i, it in enumerate(items[:10], start=1):
        lines.append(f"{i}. {it.get('displayTitle')}")
    
    return {"reply": "\n".join(lines)}
