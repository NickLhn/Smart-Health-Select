"""管理员端订单和售后管理节点."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from agent.utils import is_confirm_text, is_cancel_text, format_kv, format_lines

if TYPE_CHECKING:
    from agent.admin.states import AdminGraphState
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
        return {"reply": "无权限访问管理员工具。", "cards": []}
    if status_code == 401:
        return {"reply": "登录已过期，请重新登录后再试。", "cards": []}
    if status_code == 404:
        return {"reply": fallback, "cards": []}
    return {"reply": "工具服务暂时不可用，请稍后再试。", "cards": []}


def _order_status_text(value):
    try:
        v = int(value)
    except (TypeError, ValueError):
        return str(value)
    mapping = {
        -1: "已取消", 0: "待支付", 1: "待发货", 2: "已发货",
        3: "已完成", 4: "售后中", 5: "已退款", 7: "待审核",
    }
    return mapping.get(v, str(v))


def _refund_status_text(value):
    try:
        v = int(value)
    except (TypeError, ValueError):
        return str(value)
    if v == 0:
        return "待审核"
    if v == 1:
        return "已通过"
    if v == 2:
        return "已拒绝"
    return str(v)


def _refund_type_text(value):
    try:
        v = int(value)
    except (TypeError, ValueError):
        return str(value)
    if v == 1:
        return "仅退款"
    if v == 2:
        return "退货退款"
    return str(v)


def order_flow_node(state: "AdminGraphState") -> dict[str, Any]:
    """管理员订单和售后管理流程."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    message = (state.get("message") or "").strip()
    
    if not token:
        return {"reply": "缺少登录token，无法查询订单。", "cards": []}
    
    tools = _build_tools_client(load_settings())
    
    # 处理售后审核确认
    if state.get("pending_action") == "ADMIN_AFTERSALES_AUDIT_CONFIRM":
        return _handle_aftersales_confirm(tools, state, token, request_id)
    
    # 售后列表查询
    if any(k in message for k in ["售后", "退款", "售后列表", "退款列表"]):
        return _query_aftersales_list(tools, token, request_id)
    
    # 订单列表查询
    if any(k in message for k in ["订单列表", "查询订单"]):
        return _query_order_list(tools, token, request_id)
    
    # 默认：查询待处理售后
    return _query_aftersales_list(tools, token, request_id)


def _handle_aftersales_confirm(tools, state, token, request_id):
    """处理售后审核确认."""
    user_text = state.get("message") or ""
    draft = state.get("admin_aftersales_audit_draft") or {}
    
    if not isinstance(draft, dict) or not draft:
        return {"pending_action": None, "admin_aftersales_audit_draft": None, "reply": "操作信息已失效。", "cards": []}
    
    if is_cancel_text(user_text):
        return {"pending_action": None, "admin_aftersales_audit_draft": None, "reply": "已取消操作。", "cards": []}
    
    if not is_confirm_text(user_text):
        return {"pending_action": "ADMIN_AFTERSALES_AUDIT_CONFIRM", "reply": "请回复 1 确认或 0 取消。", "cards": []}
    
    try:
        apply_id = int(draft.get("applyId"))
        pass_ = bool(draft.get("pass"))
    except (TypeError, ValueError):
        return {"pending_action": None, "admin_aftersales_audit_draft": None, "reply": "参数无效。", "cards": []}
    
    audit_reason = draft.get("auditReason")
    if isinstance(audit_reason, str):
        audit_reason = audit_reason.strip()[:255] or None
    else:
        audit_reason = None
    
    payload = tools.admin_aftersales_audit(token, apply_id=apply_id, pass_=pass_, audit_reason=audit_reason, request_id=request_id)
    
    if not payload.get("success", True):
        err = payload.get("error") or ""
        if isinstance(err, str) and err.strip():
            return {"pending_action": None, "admin_aftersales_audit_draft": None, "reply": f"执行失败：{err.strip()}", "cards": []}
        return {"pending_action": None, "admin_aftersales_audit_draft": None, "reply": "执行失败。", "cards": []}
    
    rows = [
        ["售后ID", apply_id],
        ["结果", "已同意" if pass_ else "已拒绝"],
        ["原因", audit_reason or "-"],
    ]
    return {
        "pending_action": None,
        "admin_aftersales_audit_draft": None,
        "admin_aftersales_last_id": apply_id,
        "reply": format_lines("【执行结果】", [format_kv(rows)]),
        "cards": [],
    }


def _query_aftersales_list(tools, token, request_id):
    """查询售后列表."""
    payload = tools.admin_aftersales_list(token, status=0, page=1, size=10, request_id=request_id)
    err = _error_reply(payload, "暂无售后申请。")
    if err:
        return err
    
    data = payload.get("data") or {}
    records = data.get("records") or []
    total = data.get("total") or 0
    
    if not records:
        return {"reply": "暂无待处理售后申请。", "cards": []}
    
    lines = [f"共 {int(total)} 条售后申请（待审核，展示前 10 条）："]
    candidates = []
    
    for i, r in enumerate(records[:10], start=1):
        lines.append(
            f"{i}. 售后ID={r.get('id')} 订单={r.get('orderNo')} 用户={r.get('username')} "
            f"类型={_refund_type_text(r.get('type'))} 金额={r.get('amount')} 原因={r.get('reason')}"
        )
        candidates.append({
            "type": "AFTERSALES",
            "aftersalesId": int(r.get("id") or 0),
            "orderId": int(r.get("orderId") or 0),
            "orderNo": str(r.get("orderNo") or ""),
        })
    
    lines.append("可输入：同意 1 / 拒绝 1 原因：xxx")
    return {"candidates": candidates, "reply": "\n".join(lines), "cards": []}


def _query_order_list(tools, token, request_id):
    """查询订单列表."""
    payload = tools.admin_orders_list(token, page=1, size=10, request_id=request_id)
    err = _error_reply(payload, "暂无订单。")
    if err:
        return err
    
    data = payload.get("data") or {}
    records = data.get("records") or []
    
    if not records:
        return {"reply": "暂无订单。", "cards": []}
    
    lines = ["订单列表（前10条）："]
    for i, r in enumerate(records[:10], start=1):
        lines.append(
            f"{i}. 订单ID={r.get('id')} 订单号={r.get('orderNo')} 状态={_order_status_text(r.get('status'))} "
            f"金额={r.get('payAmount')}"
        )
    
    return {"reply": "\n".join(lines), "cards": []}
