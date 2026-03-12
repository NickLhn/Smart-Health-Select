"""管理员端商家审核节点."""

from __future__ import annotations

import re
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


def _merchant_audit_status_text(status):
    try:
        v = int(status)
    except (TypeError, ValueError):
        return str(status)
    if v == 0:
        return "待审核"
    if v == 1:
        return "已通过"
    if v == 2:
        return "已驳回"
    return str(v)


def _extract_merchant_id(text):
    import re
    t = text or ""
    m = re.search(
        r"(?:merchantId|merchantid|商家id|商家ID|店铺id|店铺ID|id|ID)\s*[:=：]?\s*(\d{1,18})",
        t,
        flags=re.IGNORECASE,
    )
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    m2 = re.search(r"(?:通过|驳回|查看|展开)\s*(?:商家)?\s*(\d{1,18})\b", t)
    if m2:
        try:
            return int(m2.group(1))
        except ValueError:
            return None
    return None


def merchant_flow_node(state: "AdminGraphState") -> dict[str, Any]:
    """商家审核管理流程."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    
    if not token:
        return {"reply": "缺少登录token，无法进行商家审核。", "cards": []}
    
    tools = _build_tools_client(load_settings())
    
    # 处理审核确认
    if state.get("pending_action") == "ADMIN_MERCHANT_AUDIT_CONFIRM":
        return _handle_audit_confirm(tools, state, token, request_id)
    
    # 查询商家列表（待审核）
    payload = tools.admin_merchants_list(token, audit_status=0, page=1, size=10, request_id=request_id)
    err = _error_reply(payload, "暂无待审核商家。")
    if err:
        return err
    
    data = payload.get("data") or {}
    records = data.get("records") or []
    total = data.get("total") or 0
    
    if not records:
        return {"reply": "暂无待审核商家。", "cards": []}
    
    lines = [f"共 {int(total)} 个待审核商家（展示前 10 条）："]
    candidates = []
    
    for i, r in enumerate(records[:10], start=1):
        if not isinstance(r, dict):
            continue
        mid = r.get("id")
        lines.append(
            f"{i}. 商家ID={mid} 店铺={r.get('shopName') or '-'} "
            f"联系人={r.get('contactName') or '-'} 电话={r.get('contactPhone') or '-'}"
        )
        candidates.append({
            "type": "MERCHANT",
            "merchantId": int(mid or 0),
            "shopName": str(r.get("shopName") or ""),
            "contactName": str(r.get("contactName") or ""),
            "contactPhone": str(r.get("contactPhone") or ""),
        })
    
    lines.append("可输入：查看 1 / 通过 1 / 驳回 1 原因：xxx")
    return {"candidates": candidates, "reply": "\n".join(lines), "cards": []}


def _handle_audit_confirm(tools, state, token, request_id):
    """处理审核确认."""
    user_text = state.get("message") or ""
    draft = state.get("admin_merchant_audit_draft") or {}
    
    if not isinstance(draft, dict) or not draft:
        return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": "操作信息已失效，请重新发起。", "cards": []}
    
    if is_cancel_text(user_text):
        return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": "已取消操作。", "cards": []}
    
    if not is_confirm_text(user_text):
        return {"pending_action": "ADMIN_MERCHANT_AUDIT_CONFIRM", "reply": "请回复 1 确认执行，或回复 0 取消。", "cards": []}
    
    try:
        merchant_id = int(draft.get("merchantId"))
        audit_status = int(draft.get("auditStatus"))
    except (TypeError, ValueError):
        return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": "商家ID或审核状态无效，请重新发起。", "cards": []}
    
    audit_remark = draft.get("auditRemark")
    if isinstance(audit_remark, str):
        audit_remark = audit_remark.strip()[:200] or None
    else:
        audit_remark = None
    
    payload = tools.admin_merchant_audit(
        token,
        merchant_id=merchant_id,
        audit_status=audit_status,
        audit_remark=audit_remark,
        request_id=request_id,
    )
    
    if not payload.get("success", True):
        err = payload.get("error") or ""
        if isinstance(err, str) and err.strip():
            return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": f"执行失败：{err.strip()}", "cards": []}
        return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": "执行失败，请稍后再试。", "cards": []}
    
    return {
        "pending_action": None,
        "admin_merchant_audit_draft": None,
        "admin_merchant_last_id": merchant_id,
        "reply": f"已完成：商家ID={merchant_id} 审核状态已更新为 {_merchant_audit_status_text(audit_status)}。",
        "cards": [],
    }
