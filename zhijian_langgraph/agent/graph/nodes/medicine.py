"""药品管理流程节点."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

from agent.utils import extract_pick_index, is_confirm_text, is_cancel_text
from agent.utils.extractors import extract_medicine_id
from agent.graph.formatters import MedicineFormatter

if TYPE_CHECKING:
    from agent.graph.states import GraphState, Candidate
    from agent.tools_client import ToolsClient


def _build_tools_client(settings: Any = None) -> "ToolsClient":
    """构建工具客户端."""
    from agent.tools_client import ToolsClient
    from agent.settings import load_settings
    if settings is None:
        settings = load_settings()
    return ToolsClient(settings)


def _resolve_medicine_id_from_index(state: "GraphState", idx: int) -> int | None:
    """从列表序号解析药品ID."""
    candidates = state.get("candidates") or []
    if idx <= 0 or idx > len(candidates):
        return None
    picked = candidates[idx - 1]
    try:
        return int(picked.get("medicineId"))
    except (TypeError, ValueError):
        return None


def medicine_flow_node(state: "GraphState") -> dict[str, Any]:
    """药品查询和管理流程."""
    from agent.settings import load_settings
    
    user_token = state.get("token") or ""
    request_id = state.get("request_id") or None
    message = (state.get("message") or "").strip()
    pending_action = state.get("pending_action")
    
    if not user_token:
        return {"reply": "缺少登录token，无法查询药品。"}
    
    tools = _build_tools_client(load_settings())
    formatter = MedicineFormatter()
    
    # 处理用户端无权的操作
    if any(message.startswith(k) for k in ["上架", "下架", "删除"]):
        return {"reply": "用户端无权操作上架/下架/删除。如需购买请说'购买 + 药品名'，或前往商品详情页下单。"}
    
    # 提取序号或ID
    idx = extract_pick_index_any(message)
    medicine_id = extract_medicine_id(message)
    if medicine_id is None and idx is not None:
        medicine_id = _resolve_medicine_id_from_index(state, idx)
    if medicine_id is None:
        medicine_id = state.get("last_medicine_id")
    
    # 药品列表查询
    if any(k in message for k in ["药品列表", "药品库", "搜索药品", "查药品", "查询药品"]):
        return _query_medicine_list(tools, user_token, message, request_id, formatter)
    
    # 药品详情查询
    if message.startswith("查看") or "药品详情" in message:
        if medicine_id is None:
            return {"reply": "请提供药品ID或列表序号，例如：查看 1 或 查看 药品id=25。"}
        return _query_medicine_detail(tools, user_token, medicine_id, request_id, formatter)
    
    # 默认帮助
    return {
        "reply": "可用指令示例：\n- 药品列表\n- 搜索药品 布洛芬\n- 查看 1\n- 购买 药品ID=25"
    }


def _query_medicine_list(
    tools: "ToolsClient",
    user_token: str,
    message: str,
    request_id: str | None,
    formatter: MedicineFormatter,
) -> dict[str, Any]:
    """查询药品列表."""
    # 提取关键词
    keyword = re.sub(r"^(药品列表|药品库|搜索药品|查药品|查询药品)\s*", "", message).strip()
    if not keyword:
        keyword = None
    
    payload = tools.medicines_list(user_token, keyword=keyword, page=1, size=10, request_id=request_id)
    if not payload.get("success", True):
        return {"reply": "查询失败，请稍后再试。"}
    
    data = payload.get("data") or {}
    records = data.get("records") or []
    total = data.get("total") or 0
    
    if not isinstance(records, list) or not records:
        return {"reply": "没有找到匹配的药品。"}
    
    # 构建候选列表和显示
    candidates: list[Candidate] = []
    lines = [f"共 {int(total)} 条药品（展示前 10 条）："]
    
    for i, r in enumerate(records[:10], start=1):
        if not isinstance(r, dict):
            continue
        lines.append(formatter.format_list_item(r, i))
        candidates.append({"medicineId": int(r.get("id") or 0), "name": str(r.get("name") or "")})
    
    lines.append("可输入：查看 1 / 购买 药品ID=xx")
    
    return {"candidates": candidates, "reply": "\n".join(lines)}


def _query_medicine_detail(
    tools: "ToolsClient",
    user_token: str,
    medicine_id: int,
    request_id: str | None,
    formatter: MedicineFormatter,
) -> dict[str, Any]:
    """查询药品详情."""
    payload = tools.medicine_detail(user_token, medicine_id=medicine_id, request_id=request_id)
    if not payload.get("success", True):
        return {"reply": "未找到该药品（可能已下架）。"}
    
    data = payload.get("data") or {}
    if not isinstance(data, dict) or not data:
        return {"reply": "未找到该药品（可能已下架）。"}
    
    reply = formatter.format_detail(data)
    return {"last_medicine_id": medicine_id, "reply": reply}


def extract_pick_index_any(text: str) -> int | None:
    """从文本中提取序号（宽松模式）."""
    m = re.search(r"\b(\d{1,2})\b", (text or "").strip())
    if not m:
        return None
    try:
        v = int(m.group(1))
    except ValueError:
        return None
    return v if v > 0 else None
