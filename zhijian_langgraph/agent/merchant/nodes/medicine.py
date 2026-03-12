"""商家端药品管理节点."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

from agent.utils import is_confirm_text, is_cancel_text
from agent.utils.extractors import extract_medicine_id
from agent.utils.extractors import extract_pick_index_any
from agent.graph.formatters.common import StatusTextFormatter

if TYPE_CHECKING:
    from agent.merchant.states import MerchantGraphState
    from agent.tools_client import ToolsClient


def _build_tools_client(settings: Any = None) -> "ToolsClient":
    from agent.tools_client import ToolsClient
    from agent.settings import load_settings
    if settings is None:
        settings = load_settings()
    return ToolsClient(settings)


def _error_reply(payload: dict[str, Any], fallback: str) -> dict[str, Any] | None:
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


def _resolve_medicine_id_from_index(state: "MerchantGraphState", idx: int) -> int | None:
    candidates = state.get("candidates") or []
    if idx <= 0 or idx > len(candidates):
        return None
    picked = candidates[idx - 1]
    if str(picked.get("type") or "") != "medicine":
        return None
    try:
        return int(picked.get("medicineId"))
    except (TypeError, ValueError):
        return None


def medicine_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """商家药品管理流程."""
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
    if pending_action in {"MEDICINE_STATUS_CONFIRM", "MEDICINE_DELETE_CONFIRM"}:
        return _handle_confirm_action(tools, state, token, request_id, status_fmt)
    
    # 提取序号或ID
    idx = extract_pick_index_any(message)
    medicine_id = extract_medicine_id(message)
    if medicine_id is None and idx is not None:
        medicine_id = _resolve_medicine_id_from_index(state, idx)
    if medicine_id is None:
        medicine_id = state.get("last_medicine_id")
    
    # 药品列表查询
    if any(k in message for k in ["药品列表", "我的药品", "药品库", "商品列表", "我的商品", "搜索药品", "查药品", "查询药品"]):
        return _query_medicine_list(tools, token, message, request_id, status_fmt)
    
    # 药品详情
    if message.startswith("查看") or "药品详情" in message:
        if medicine_id is None:
            return {"reply": "请提供药品ID或列表序号，例如：查看 1 或 查看 药品id=25。", "cards": []}
        return _query_medicine_detail(tools, token, medicine_id, request_id, status_fmt)
    
    # 上架/下架
    if message.startswith("上架") or message.startswith("下架"):
        if medicine_id is None:
            return {"reply": "请提供药品ID或列表序号，例如：上架 1 / 下架 药品id=25。", "cards": []}
        to_status = 1 if message.startswith("上架") else 0
        return _preview_status_change(tools, token, medicine_id, to_status, request_id, status_fmt)
    
    # 删除
    if message.startswith("删除"):
        if medicine_id is None:
            return {"reply": "请提供药品ID或列表序号，例如：删除 1 或 删除 药品id=25。", "cards": []}
        return _preview_delete(tools, token, medicine_id, request_id, status_fmt)
    
    # 默认帮助
    return {
        "reply": "可用指令示例：\n- 药品列表\n- 搜索药品 布洛芬\n- 只看下架药品列表\n- 查看 1\n- 上架 1 / 下架 1\n- 删除 1",
        "cards": [],
    }


def _handle_confirm_action(tools, state, token, request_id, status_fmt):
    """处理确认操作."""
    message = (state.get("message") or "").strip()
    pending_action = state.get("pending_action")
    draft = state.get("medicine_draft") or {}
    
    if not isinstance(draft, dict) or not draft:
        return {"pending_action": None, "medicine_draft": None, "reply": "操作信息已失效，请重新发起。", "cards": []}
    
    if is_cancel_text(message):
        return {"pending_action": None, "medicine_draft": None, "reply": "已取消操作。", "cards": []}
    
    if not is_confirm_text(message):
        return {"pending_action": pending_action, "reply": "请回复 1 确认执行，或回复 0 取消。", "cards": []}
    
    try:
        medicine_id = int(draft.get("medicineId"))
    except (TypeError, ValueError):
        return {"pending_action": None, "medicine_draft": None, "reply": "药品ID无效，请重新发起。", "cards": []}
    
    if pending_action == "MEDICINE_STATUS_CONFIRM":
        try:
            to_status = int(draft.get("toStatus"))
        except (TypeError, ValueError):
            return {"pending_action": None, "medicine_draft": None, "reply": "目标状态无效，请重新发起。", "cards": []}
        
        payload = tools.merchant_set_medicine_status(token, medicine_id=medicine_id, status=to_status, request_id=request_id)
        err = _error_reply(payload, "执行失败，请稍后再试。")
        if err:
            return {"pending_action": None, "medicine_draft": None, **err}
        
        return {
            "pending_action": None,
            "medicine_draft": None,
            "last_medicine_id": medicine_id,
            "reply": f"已完成：药品ID={medicine_id} 状态已更新为 {status_fmt.medicine_status(to_status)}。",
            "cards": [],
        }
    
    # DELETE
    payload = tools.merchant_delete_medicine(token, medicine_id=medicine_id, request_id=request_id)
    err = _error_reply(payload, "执行失败，请稍后再试。")
    if err:
        return {"pending_action": None, "medicine_draft": None, **err}
    
    return {
        "pending_action": None,
        "medicine_draft": None,
        "last_medicine_id": medicine_id,
        "reply": f"已完成：药品ID={medicine_id} 已删除（逻辑删除）。",
        "cards": [],
    }


def _query_medicine_list(tools, token, message, request_id, status_fmt):
    """查询药品列表."""
    status = None
    if "只看上架" in message or ("上架" in message and "下架" not in message and "列表" in message):
        status = 1
    if "只看下架" in message or ("下架" in message and "上架" not in message and "列表" in message):
        status = 0
    
    keyword = message
    keyword = re.sub(r"^(药品列表|我的药品|药品库|商品列表|我的商品|搜索药品|查药品|查询药品)\s*", "", keyword).strip()
    if keyword in {"只看上架", "只看下架"}:
        keyword = ""
    if not keyword:
        keyword = None
    
    payload = tools.merchant_medicines_list(token, keyword=keyword, status=status, page=1, size=10, request_id=request_id)
    err = _error_reply(payload, "查询失败，请稍后再试。")
    if err:
        return err
    
    data = payload.get("data") or {}
    records = data.get("records") or []
    total = data.get("total") or 0
    
    if not isinstance(records, list) or not records:
        return {"reply": "没有找到匹配的药品。", "cards": []}
    
    candidates = []
    lines = [f"共 {int(total)} 条药品（展示前 10 条）："]
    for i, r in enumerate(records[:10], start=1):
        if not isinstance(r, dict):
            continue
        mid = r.get("id")
        name = r.get("name") or "-"
        st = status_fmt.medicine_status(r.get("status"))
        price = r.get("price")
        stock = r.get("stock")
        img = r.get("mainImage") or ""
        candidates.append({
            "type": "medicine",
            "medicineId": int(mid) if mid is not None else 0,
            "name": str(name),
            "status": int(r.get("status") or 0),
            "price": float(price or 0),
            "stock": int(stock or 0),
            "mainImage": str(img or ""),
        })
        lines.append(f"{i}. 药品ID={mid} 名称={name} 状态={st} 价格={price} 库存={stock}")
    lines.append("")
    lines.append("可输入：查看 1 / 上架 1 / 下架 1 / 删除 1")
    return {"candidates": candidates, "reply": "\n".join(lines), "cards": []}


def _query_medicine_detail(tools, token, medicine_id, request_id, status_fmt):
    """查询药品详情."""
    payload = tools.merchant_medicine_detail(token, medicine_id=medicine_id, request_id=request_id)
    err = _error_reply(payload, "未找到该药品或无权查看。")
    if err:
        return err
    
    data = payload.get("data") or {}
    if not isinstance(data, dict) or not data:
        return {"reply": "未找到该药品或无权查看。", "cards": []}
    
    img = data.get("mainImage")
    lines = ["【药品详情】"]
    lines.append(f"药品ID：{data.get('id')}")
    lines.append(f"名称：{data.get('name')}")
    lines.append(f"状态：{status_fmt.medicine_status(data.get('status'))}")
    lines.append(f"价格：{data.get('price')}")
    lines.append(f"库存：{data.get('stock')}")
    if data.get("specs"):
        lines.append(f"规格：{data.get('specs')}")
    if data.get("categoryName"):
        lines.append(f"分类：{data.get('categoryName')}")
    if img:
        lines.append(f"主图：{img}")
    lines.append("")
    lines.append(f"可输入：上架 {medicine_id} / 下架 {medicine_id} / 删除 {medicine_id}")
    return {"last_medicine_id": medicine_id, "reply": "\n".join(lines), "cards": []}


def _preview_status_change(tools, token, medicine_id, to_status, request_id, status_fmt):
    """预览状态变更."""
    preview = tools.merchant_preview_medicine_status(token, medicine_id=medicine_id, to_status=to_status, request_id=request_id)
    err = _error_reply(preview, "预览失败，请稍后再试。")
    if err:
        return err
    
    pdata = preview.get("data") or {}
    if not isinstance(pdata, dict):
        return {"reply": "预览数据异常。", "cards": []}
    
    if not pdata.get("allowed", True):
        return {"reply": f"无需执行：当前状态已是 {status_fmt.medicine_status(pdata.get('currentStatus'))}。", "cards": []}
    
    draft = {"medicineId": medicine_id, "toStatus": to_status}
    return {
        "pending_action": "MEDICINE_STATUS_CONFIRM",
        "medicine_draft": draft,
        "last_medicine_id": medicine_id,
        "reply": "\n".join([
            "【预览】",
            f"药品：{pdata.get('name') or '-'}（ID={medicine_id}）",
            f"当前状态：{status_fmt.medicine_status(pdata.get('currentStatus'))}",
            f"目标状态：{status_fmt.medicine_status(to_status)}",
            "请回复 1 确认执行 / 0 取消",
        ]),
        "cards": [],
    }


def _preview_delete(tools, token, medicine_id, request_id, status_fmt):
    """预览删除操作."""
    preview = tools.merchant_preview_medicine_delete(token, medicine_id=medicine_id, request_id=request_id)
    err = _error_reply(preview, "预览失败，请稍后再试。")
    if err:
        return err
    
    pdata = preview.get("data") or {}
    if not isinstance(pdata, dict):
        return {"reply": "预览数据异常。", "cards": []}
    
    if not pdata.get("allowed", True):
        return {
            "reply": "\n".join([
                "【预览】",
                f"药品：{pdata.get('name') or '-'}（ID={medicine_id}）",
                f"当前状态：{status_fmt.medicine_status(pdata.get('currentStatus'))}",
                "删除前必须先下架。",
                f"可直接输入：下架 {medicine_id}",
            ]),
            "cards": [],
        }
    
    draft = {"medicineId": medicine_id}
    return {
        "pending_action": "MEDICINE_DELETE_CONFIRM",
        "medicine_draft": draft,
        "last_medicine_id": medicine_id,
        "reply": "\n".join([
            "【预览】",
            f"药品：{pdata.get('name') or '-'}（ID={medicine_id}）",
            "操作：删除（逻辑删除，历史订单不受影响）",
            "请回复 1 确认执行 / 0 取消",
        ]),
        "cards": [],
    }
