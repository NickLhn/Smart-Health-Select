"""管理员端用户管理节点."""

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


def _status_text(status):
    try:
        v = int(status)
    except (TypeError, ValueError):
        return str(status)
    return "正常" if v == 1 else "禁用" if v == 0 else str(v)


def _status_from_text(text):
    t = text or ""
    if any(k in t for k in ["禁用", "停用", "封禁"]):
        return 0
    if any(k in t for k in ["启用", "解禁", "恢复"]):
        return 1
    return None


def _extract_user_id(text):
    import re
    t = text or ""
    m = re.search(r"(?:userId|userid|用户id|用户ID|id|ID)\s*[:=：]?\s*(\d{1,18})", t, flags=re.IGNORECASE)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    m2 = re.search(r"(?:禁用|启用|解禁|恢复)\s*(?:用户)?\s*(\d{1,18})\b", t)
    if m2:
        try:
            return int(m2.group(1))
        except ValueError:
            return None
    return None


def _extract_reason(text):
    import re
    t = (text or "").strip()
    m = re.search(r"(?:原因|理由|备注)\s*[:：]\s*(.+)$", t)
    if not m:
        return None
    r = (m.group(1) or "").strip()
    if not r:
        return None
    return r[:200]


def query_flow_node(state: "AdminGraphState") -> dict[str, Any]:
    """查询用户列表."""
    from agent.settings import load_settings
    from agent.utils import extract_pick_index
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    
    if not token:
        return {"reply": "缺少登录token，无法查询用户。", "cards": []}
    
    tools = _build_tools_client(load_settings())
    
    # 提取关键词
    keyword = (state.get("message") or "").strip()
    keyword = re.sub(r"^(查用户|查询用户|搜索用户|找用户)\s*", "", keyword).strip()
    if not keyword:
        keyword = None
    
    payload = tools.admin_users_list(token, keyword=keyword, page=1, size=10, request_id=request_id)
    if not payload.get("success", True):
        return {"reply": "工具服务暂时不可用，请稍后再试。", "cards": []}
    
    data = payload.get("data") or {}
    records = data.get("records") or []
    total = data.get("total") or 0
    
    if not isinstance(records, list) or not records:
        return {"reply": "没有找到匹配的普通用户。", "cards": []}
    
    lines = [f"为你找到 {int(total)} 个普通用户（展示前 10 条）："]
    for i, u in enumerate(records[:10], start=1):
        if not isinstance(u, dict):
            continue
        lines.append(
            f"{i}. id={u.get('id')} 账号={u.get('username') or '-'} 昵称={u.get('nickname') or '-'} "
            f"手机={u.get('mobile') or '-'} 状态={_status_text(u.get('status'))}"
        )
    
    lines.append("你可以发：禁用用户 id=xxx 原因：xxx，或 启用用户 id=xxx 原因：xxx")
    return {"reply": "\n".join(lines), "cards": []}


def status_flow_node(state: "AdminGraphState") -> dict[str, Any]:
    """用户状态管理（禁用/启用）."""
    from agent.settings import load_settings
    from agent.utils import extract_pick_index, extract_mobile
    import re
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    
    if not token:
        return {"reply": "缺少登录token，无法修改用户状态。", "cards": []}
    
    tools = _build_tools_client(load_settings())
    message = state.get("message") or ""
    
    # 处理确认流程
    if state.get("pending_action") == "ADMIN_USER_STATUS_CONFIRM":
        return _handle_status_confirm(tools, state, token, request_id)
    
    # 确定目标状态
    to_status = _status_from_text(message)
    if to_status is None:
        return {"reply": "请说明要'启用'还是'禁用'该用户。", "cards": []}
    
    reason = _extract_reason(message)
    user_id = _extract_user_id(message)
    mobile = extract_mobile(message)
    
    draft = {"toStatus": to_status}
    if reason:
        draft["reason"] = reason
    
    # 直接提供了用户ID
    if user_id is not None:
        return _handle_direct_user_id(tools, token, user_id, to_status, reason, request_id)
    
    # 通过手机号或关键词搜索
    keyword = mobile if mobile else re.sub(r"^(禁用|启用|解禁|恢复)\s*(用户)?", "", message).strip()
    keyword = re.sub(r"(原因|理由|备注)\s*[:：].*$", "", keyword).strip()
    keyword = keyword or None
    
    if not keyword:
        return {"reply": "请提供用户ID或手机号或用户名/昵称关键词。", "cards": []}
    
    return _handle_user_search(tools, token, keyword, to_status, reason, request_id)


def _handle_status_confirm(tools, state, token, request_id):
    """处理状态变更确认."""
    user_text = state.get("message") or ""
    draft = state.get("admin_user_status_draft") or {}
    
    if not isinstance(draft, dict) or not draft:
        return {"pending_action": None, "admin_user_status_draft": None, "reply": "操作信息已失效，请重新发起。"}
    
    if is_cancel_text(user_text):
        return {"pending_action": None, "admin_user_status_draft": None, "reply": "已取消操作。"}
    
    if not is_confirm_text(user_text):
        return {"pending_action": "ADMIN_USER_STATUS_CONFIRM", "reply": "请回复 1 确认执行，或回复 0 取消。"}
    
    try:
        user_id = int(draft.get("userId"))
        to_status = int(draft.get("toStatus"))
    except (TypeError, ValueError):
        return {"pending_action": None, "admin_user_status_draft": None, "reply": "用户ID或目标状态无效，请重新发起。"}
    
    reason = draft.get("reason")
    if isinstance(reason, str):
        reason = reason.strip()[:200]
    else:
        reason = None
    
    payload = tools.admin_set_user_status(token, user_id=user_id, status=to_status, reason=reason, request_id=request_id)
    
    if not payload.get("success", True):
        err = payload.get("error") or ""
        if isinstance(err, str) and err.strip():
            return {"pending_action": None, "admin_user_status_draft": None, "reply": f"执行失败：{err.strip()}"}
        return {"pending_action": None, "admin_user_status_draft": None, "reply": "执行失败，请稍后再试。"}
    
    picked = draft.get("pickedUser") if isinstance(draft.get("pickedUser"), dict) else {}
    label = picked.get("username") or picked.get("nickname") or f"id={user_id}"
    
    return {
        "pending_action": None,
        "admin_user_status_draft": None,
        "reply": f"已执行：{label} 状态已设置为 {_status_text(to_status)}。",
        "cards": [],
    }


def _handle_direct_user_id(tools, token, user_id, to_status, reason, request_id):
    """直接通过用户ID处理."""
    detail = tools.admin_user_detail(token, user_id=user_id, request_id=request_id)
    
    if not detail.get("success", True):
        err = detail.get("error") or ""
        if isinstance(err, str) and err.strip():
            return {"reply": f"查询用户失败：{err.strip()}", "cards": []}
        return {"reply": "查询用户失败，请稍后再试。", "cards": []}
    
    user_data = detail.get("data") or {}
    if not isinstance(user_data, dict) or not user_data:
        return {"reply": "未找到该用户。", "cards": []}
    
    current_status = user_data.get("status")
    if str(current_status) == str(to_status):
        label = user_data.get("username") or user_data.get("nickname") or f"id={user_id}"
        return {"reply": f"无需执行：{label} 当前状态已是 {_status_text(to_status)}。", "cards": []}
    
    draft = {
        "userId": int(user_data.get("id") or user_id),
        "pickedUser": {
            "userId": int(user_data.get("id") or user_id),
            "username": user_data.get("username") or "",
            "nickname": user_data.get("nickname") or "",
            "mobile": user_data.get("mobile") or "",
            "status": user_data.get("status"),
        },
        "toStatus": to_status,
        "reason": reason,
    }
    
    label = user_data.get("username") or user_data.get("nickname") or f"id={draft['userId']}"
    reason_text = f"；原因：{reason}" if reason else ""
    
    return {
        "pending_action": "ADMIN_USER_STATUS_CONFIRM",
        "admin_user_status_draft": draft,
        "reply": f"即将把 {label} 设置为 {_status_text(to_status)}{reason_text}。请回复 1 确认执行，或回复 0 取消。",
        "cards": [],
    }


def _handle_user_search(tools, token, keyword, to_status, reason, request_id):
    """通过关键词搜索用户."""
    users_payload = tools.admin_users_list(token, keyword=keyword, page=1, size=10, request_id=request_id)
    
    if not users_payload.get("success", True):
        return {"reply": "工具服务暂时不可用，请稍后再试。", "cards": []}
    
    data = users_payload.get("data") or {}
    records = data.get("records") or []
    
    if not isinstance(records, list) or not records:
        return {"reply": "没有找到匹配的普通用户。", "cards": []}
    
    # 构建候选列表
    candidates = []
    for row in records[:10]:
        if not isinstance(row, dict):
            continue
        try:
            uid = int(row.get("id"))
        except (TypeError, ValueError):
            continue
        candidates.append({
            "type": "USER",
            "userId": uid,
            "username": str(row.get("username") or ""),
            "nickname": str(row.get("nickname") or ""),
            "mobile": str(row.get("mobile") or ""),
            "status": row.get("status"),
            "createTime": str(row.get("createTime") or ""),
        })
    
    if len(candidates) == 1:
        # 只有一个匹配，直接处理
        picked = candidates[0]
        draft = {
            "userId": int(picked.get("userId")),
            "pickedUser": picked,
            "toStatus": to_status,
            "reason": reason,
        }
        
        if str(picked.get("status")) == str(to_status):
            label = picked.get("username") or picked.get("nickname") or f"id={draft['userId']}"
            return {"reply": f"无需执行：{label} 当前状态已是 {_status_text(to_status)}。", "cards": []}
        
        label = picked.get("username") or picked.get("nickname") or f"id={draft['userId']}"
        reason_text = f"；原因：{reason}" if reason else ""
        
        return {
            "pending_action": "ADMIN_USER_STATUS_CONFIRM",
            "admin_user_status_draft": draft,
            "reply": f"即将把 {label} 设置为 {_status_text(to_status)}{reason_text}。请回复 1 确认执行，或回复 0 取消。",
            "cards": [],
        }
    
    # 多个匹配，让用户选择
    lines = ["匹配到多个用户，请输入序号选择："]
    for i, u in enumerate(candidates, start=1):
        label = u.get("username") or u.get("nickname") or ""
        lines.append(
            f"{i}. id={u.get('userId')} 账号={label or '-'} 手机={u.get('mobile') or '-'} 状态={_status_text(u.get('status'))}"
        )
    
    return {
        "pending_action": "ADMIN_USER_PICK",
        "admin_user_status_draft": {"toStatus": to_status, "reason": reason},
        "candidates": candidates,
        "reply": "\n".join(lines),
        "cards": [],
    }
