"""管理员端药品管理节点."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from agent.utils import is_confirm_text, is_cancel_text
from agent.graph.formatters.common import StatusTextFormatter

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


def medicine_flow_node(state: "AdminGraphState") -> dict[str, Any]:
    """管理员药品管理流程."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    
    if not token:
        return {"reply": "缺少登录token，无法管理药品。", "cards": []}
    
    tools = _build_tools_client(load_settings())
    status_fmt = StatusTextFormatter()
    
    message = (state.get("message") or "").strip()
    pending_action = state.get("pending_action")
    
    # 处理确认操作
    if pending_action in {"ADMIN_MEDICINE_STATUS_CONFIRM", "ADMIN_MEDICINE_DELETE_CONFIRM"}:
        return _handle_confirm_action(tools, state, token, request_id, status_fmt)
    
    # 提取ID
    from agent.utils.extractors import extract_medicine_id
    medicine_id = extract_medicine_id(message)
    if medicine_id is None:
        medicine_id = state.get("admin_medicine_last_id")
    
    # 药品列表
    if any(k in message for k in ["药品列表", "商品列表", "药品库", "搜索药品", "查药品"]):
        return _query_medicine_list(tools, token, request_id)
    
    # 药品详情
    if message.startswith("查看") or "详情" in message:
        if medicine_id is None:
            return {"reply": "请提供药品ID，例如：查看 123。", "cards": []}
        return _query_medicine_detail(tools, token, medicine_id, request_id, status_fmt)
    
    # 上架/下架
    if message.startswith("上架") or message.startswith("下架"):
        if medicine_id is None:
            return {"reply": "请提供药品ID，例如：上架 123。", "cards": []}
        to_status = 1 if message.startswith("上架") else 0
        return _preview_status_change(tools, token, medicine_id, to_status, request_id, status_fmt)
    
    # 删除
    if message.startswith("删除"):
        if medicine_id is None:
            return {"reply": "请提供药品ID，例如：删除 123。", "cards": []}
        return _preview_delete(tools, token, medicine_id, request_id, status_fmt)
    
    return {
        "reply": "可用指令：\n- 药品列表\n- 查看 药品ID\n- 上架 药品ID\n- 下架 药品ID\n- 删除 药品ID",
        "cards": [],
    }


def _handle_confirm_action(tools, state, token, request_id, status_fmt):
    """处理确认操作."""
    message = (state.get("message") or "").strip()
    pending_action = state.get("pending_action")
    draft = state.get("admin_medicine_status_draft") or state.get("admin_medicine_delete_draft") or {}
    
    if not draft:
        return {"pending_action": None, "reply": "操作信息已失效。", "cards": []}
    
    if is_cancel_text(message):
        return {"pending_action": None, "reply": "已取消操作。", "cards": []}
    
    if not is_confirm_text(message):
        return {"pending_action": pending_action, "reply": "请回复 1 确认或 0 取消。", "cards": []}
    
    try:
        medicine_id = int(draft.get("medicineId"))
    except (TypeError, ValueError):
        return {"pending_action": None, "reply": "药品ID无效。", "cards": []}
    
    # 状态变更
    if pending_action == "ADMIN_MEDICINE_STATUS_CONFIRM":
        try:
            to_status = int(draft.get("toStatus"))
        except (TypeError, ValueError):
            return {"pending_action": None, "reply": "目标状态无效。", "cards": []}
        
        payload = tools.admin_set_medicine_status(token, medicine_id=medicine_id, status=to_status, request_id=request_id)
        err = _error_reply(payload, "执行失败。")
        if err:
            return {**err, "pending_action": None}
        
        return {
            "pending_action": None,
            "admin_medicine_last_id": medicine_id,
            "reply": f"已完成：药品ID={medicine_id} 状态更新为 {status_fmt.medicine_status(to_status)}。",
            "cards": [],
        }
    
    # 删除
    payload = tools.admin_delete_medicine(token, medicine_id=medicine_id, request_id=request_id)
    err = _error_reply(payload, "删除失败。")
    if err:
        return {**err, "pending_action": None}
    
    return {
        "pending_action": None,
        "admin_medicine_last_id": medicine_id,
        "reply": f"已完成：药品ID={medicine_id} 已删除。",
        "cards": [],
    }


def _query_medicine_list(tools, token, request_id):
    """查询药品列表."""
    payload = tools.admin_medicines_list(token, page=1, size=10, request_id=request_id)
    err = _error_reply(payload, "查询失败。")
    if err:
        return err
    
    data = payload.get("data") or {}
    records = data.get("records") or []
    
    if not records:
        return {"reply": "暂无药品数据。", "cards": []}
    
    lines = ["药品列表（前10条）："]
    for i, r in enumerate(records[:10], start=1):
        lines.append(f"{i}. ID={r.get('id')} {r.get('name')} 状态={r.get('status')} 价格={r.get('price')}")
    
    return {"reply": "\n".join(lines), "cards": []}


def _query_medicine_detail(tools, token, medicine_id, request_id, status_fmt):
    """查询药品详情."""
    payload = tools.admin_medicine_detail(token, medicine_id=medicine_id, request_id=request_id)
    err = _error_reply(payload, "未找到该药品。")
    if err:
        return err
    
    data = payload.get("data") or {}
    lines = [
        "【药品详情】",
        f"ID：{data.get('id')}",
        f"名称：{data.get('name')}",
        f"状态：{status_fmt.medicine_status(data.get('status'))}",
        f"价格：{data.get('price')}",
        f"库存：{data.get('stock')}",
    ]
    return {"admin_medicine_last_id": medicine_id, "reply": "\n".join(lines), "cards": []}


def _preview_status_change(tools, token, medicine_id, to_status, request_id, status_fmt):
    """预览状态变更."""
    draft = {"medicineId": medicine_id, "toStatus": to_status}
    return {
        "pending_action": "ADMIN_MEDICINE_STATUS_CONFIRM",
        "admin_medicine_status_draft": draft,
        "reply": f"【预览】即将把药品ID={medicine_id} 状态设置为 {status_fmt.medicine_status(to_status)}。\n回复 1 确认 / 0 取消",
        "cards": [],
    }


def _preview_delete(tools, token, medicine_id, request_id, status_fmt):
    """预览删除操作."""
    draft = {"medicineId": medicine_id}
    return {
        "pending_action": "ADMIN_MEDICINE_DELETE_CONFIRM",
        "admin_medicine_delete_draft": draft,
        "reply": f"【预览】即将删除药品ID={medicine_id}。\n回复 1 确认 / 0 取消",
        "cards": [],
    }
