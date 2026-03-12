"""管理员端输入归一化节点."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from agent.admin.states import AdminGraphState


def normalize_input_node(state: "AdminGraphState") -> dict[str, Any]:
    """归一化管理员输入."""
    message = state.get("message") or ""
    pending_action = state.get("pending_action")
    
    updates: dict[str, Any] = {"message": message}
    
    # 处理用户状态确认
    if pending_action in {"ADMIN_USER_PICK", "ADMIN_USER_STATUS_CONFIRM"}:
        updates["intent"] = "USER_STATUS"
        return updates
    
    # 处理商家审核确认
    if pending_action in {"ADMIN_MERCHANT_AUDIT_CONFIRM"}:
        updates["intent"] = "MERCHANT"
        return updates
    
    # 处理药品操作确认
    if pending_action in {"ADMIN_MEDICINE_STATUS_CONFIRM", "ADMIN_MEDICINE_DELETE_CONFIRM"}:
        updates["intent"] = "MEDICINE"
        return updates
    
    # 处理售后审核确认
    if pending_action in {"ADMIN_AFTERSALES_AUDIT_CONFIRM"}:
        updates["intent"] = "ORDER"
        return updates
    
    # 自动检测意图
    from agent.admin.nodes.intent import classify_admin_intent
    detected = classify_admin_intent(message)
    
    # 根据当前候选列表类型调整意图
    candidates = state.get("candidates") or []
    if candidates:
        first_type = candidates[0].get("type") if candidates else None
        if detected == "MERCHANT":
            if message.strip().startswith("查看"):
                if first_type == "AFTERSALES":
                    updates["intent"] = "ORDER"
                    return updates
                if first_type == "ORDER":
                    updates["intent"] = "ORDER"
                    return updates
                if first_type == "MEDICINE":
                    updates["intent"] = "MEDICINE"
                    return updates
    
    updates["intent"] = detected
    return updates


def handle_pending_pick_node(state: "AdminGraphState") -> dict[str, Any]:
    """处理待选择项."""
    from agent.utils import extract_pick_index
    
    if state.get("pending_action") != "ADMIN_USER_PICK":
        return {}
    
    idx = extract_pick_index(state.get("message") or "")
    if idx is None:
        return {}
    
    candidates = state.get("candidates") or []
    if idx > len(candidates):
        return {}
    
    picked = candidates[idx - 1]
    try:
        user_id = int(picked.get("userId"))
    except (TypeError, ValueError):
        return {}
    
    draft = state.get("admin_user_status_draft") or {}
    if not isinstance(draft, dict):
        draft = {}
    draft["userId"] = user_id
    draft["pickedUser"] = picked
    
    return {
        "admin_user_status_draft": draft,
        "pending_action": None,
        "candidates": [],
    }
