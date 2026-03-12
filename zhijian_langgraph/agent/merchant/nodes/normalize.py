"""商家端输入归一化节点."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from agent.utils import extract_pick_index
from agent.utils.extractors import extract_medicine_id, extract_order_no
from agent.merchant.nodes.intent import classify_merchant_intent

if TYPE_CHECKING:
    from agent.merchant.states import MerchantGraphState


def normalize_input_node(state: "MerchantGraphState") -> dict[str, Any]:
    """归一化商家端输入."""
    message = state.get("message") or ""
    pending_action = state.get("pending_action")
    idx = extract_pick_index(message)
    order_no = extract_order_no(message)
    
    updates: dict[str, Any] = {"message": message, "cards": []}
    
    # 处理药品管理确认
    if pending_action in {"MEDICINE_STATUS_CONFIRM", "MEDICINE_DELETE_CONFIRM"}:
        updates["intent"] = "MEDICINE_MGMT"
        return updates
    
    # 处理转化建议产品选择
    if pending_action == "CONV_NEED_PRODUCT":
        m = (message or "").strip()
        if m in {"取消", "不用了", "算了"}:
            updates["pending_action"] = None
        elif any(k in m for k in ["订单", "退款", "售后", "库存", "趋势", "排行", "概览", "诊断", "合规", "话术"]):
            updates["pending_action"] = None
        else:
            updates["intent"] = "CONVERSION_ADVICE"
            return updates
    
    # 处理时间范围选择
    if pending_action == "TIME_RANGE_PICK":
        if idx is not None:
            updates["intent"] = state.get("pending_intent") or "OTHER"
            return updates
        updates["pending_action"] = None
        updates["pending_intent"] = None
    
    # 处理列表选择
    if pending_action == "REFUND_PICK":
        if idx is not None:
            updates["intent"] = "REFUND_LIST"
            return updates
        updates["pending_action"] = None
        updates["candidates"] = []
    
    if pending_action == "PRODUCT_PICK":
        if idx is not None:
            updates["intent"] = "TOP_PRODUCTS"
            return updates
        updates["pending_action"] = None
        updates["candidates"] = []
    
    if pending_action == "CONV_PRODUCT_PICK":
        if idx is not None:
            updates["intent"] = "CONVERSION_ADVICE"
            return updates
        updates["pending_action"] = None
        updates["candidates"] = []
    
    if pending_action == "PENDING_PICK":
        idx = extract_pick_index(message)
        if idx is None:
            updates["intent"] = "ORDERS_PENDING"
        return updates
    
    if pending_action == "ORDER_PICK" and (idx is not None or order_no):
        updates["intent"] = "ORDER_DETAIL"
    else:
        updates["intent"] = classify_merchant_intent(message)
    
    if order_no:
        updates["order_no"] = order_no
    
    return updates


def handle_pending_pick_node(state: "MerchantGraphState") -> dict[str, Any]:
    """处理待选择项."""
    action = state.get("pending_action")
    if not action:
        return {}
    
    # 时间范围选择
    if action == "TIME_RANGE_PICK":
        idx = extract_pick_index(state.get("message") or "")
        if idx not in {1, 2, 3}:
            return {"pending_action": "TIME_RANGE_PICK", "reply": "请选择时间范围：1今天/2近7天/3近30天"}
        tr = "today" if idx == 1 else ("last7" if idx == 2 else "last30")
        return {"time_range_override": tr, "pending_action": None, "pending_intent": None}
    
    idx = extract_pick_index(state.get("message") or "")
    if idx is None:
        return {}
    
    candidates = state.get("candidates") or []
    if idx > len(candidates):
        return {}
    
    picked = candidates[idx - 1]
    
    if action == "ORDER_PICK":
        order_no = picked.get("orderNo")
        if order_no:
            return {"order_no": str(order_no), "pending_action": None}
        return {}
    
    if action == "REFUND_PICK":
        return {"pending_action": None, "candidates": [], "picked_refund": picked}
    
    if action == "PRODUCT_PICK":
        return {"pending_action": None, "candidates": [], "picked_product": picked}
    
    if action == "CONV_PRODUCT_PICK":
        return {"pending_action": None, "candidates": [], "picked_conv_product": picked}
    
    return {}


def _time_range_from_text(text: str, default: str) -> str:
    """从文本中提取时间范围."""
    t = text or ""
    if "昨天" in t:
        return "yesterday"
    if "近7" in t or "最近7" in t or "一周" in t:
        return "last7"
    if "近30" in t or "最近30" in t or "一个月" in t or "30天" in t:
        return "last30"
    if "今天" in t or "今日" in t:
        return "today"
    return default


def _has_explicit_time_range(text: str) -> bool:
    """是否有明确的时间范围."""
    t = text or ""
    return any(k in t for k in ["今天", "今日", "昨天", "近7", "最近7", "一周", "近30", "最近30", "30天", "一个月"])


def _ask_time_range(next_intent: str) -> dict[str, Any]:
    """询问时间范围."""
    return {
        "pending_action": "TIME_RANGE_PICK",
        "pending_intent": next_intent,
        "cards": [],
        "reply": "看哪个时间范围？回复：1=今天；2=近7天；3=近30天",
    }
