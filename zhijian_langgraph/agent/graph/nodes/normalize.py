"""输入归一化节点."""

from __future__ import annotations

from typing import Any

from agent.graph.states import GraphState
from agent.graph.nodes.intent import classify_intent
from agent.utils import extract_order_no, extract_pick_index


def normalize_input_node(state: GraphState) -> dict[str, Any]:
    """归一化用户输入，提取关键信息.
    
    处理：
    1. 识别意图
    2. 提取订单号
    3. 处理待处理动作
    """
    message = state.get("message") or ""
    pending_action = state.get("pending_action")
    
    updates: dict[str, Any] = {"message": message}
    
    # 如果是购买确认流程，强制意图为 PURCHASE
    if pending_action == "PURCHASE_CONFIRM":
        updates["intent"] = "PURCHASE"
        return updates
    
    # 处理待选择动作（列表选择）
    if pending_action in {"ORDER_PICK", "REFUND_PICK", "SHIPPING_PICK"}:
        pick_idx = extract_pick_index(message)
        extracted_order_no = extract_order_no(message)
        
        if pick_idx is not None or extracted_order_no is not None:
            # 根据 pending_action 设置意图
            intent_map = {
                "ORDER_PICK": "ORDER",
                "REFUND_PICK": "REFUND",
                "SHIPPING_PICK": "SHIPPING",
            }
            updates["intent"] = intent_map.get(pending_action, "OTHER")
            
            # 如果提取到订单号，清除 pending_action
            if extracted_order_no:
                updates["order_no"] = extracted_order_no
                updates["pending_action"] = None
                updates["candidates"] = []
            
            return updates
    
    # 购买关键词检测
    purchase_terms = ["下单", "购买", "怎么买", "加入购物车", "结算", "付款", "支付"]
    if (
        any(t in message for t in purchase_terms)
        and "订单" not in message
        and "退款" not in message
        and "物流" not in message
        and "配送" not in message
        and extract_order_no(message) is None
    ):
        detected = "PURCHASE"
    else:
        detected = classify_intent(message)
    
    # 特殊处理：保持 MEDICAL 意图（除非明确切换）
    prev_intent = state.get("intent")
    if prev_intent == "MEDICAL" and detected == "OTHER":
        if (
            "订单" in message
            or "退款" in message
            or "物流" in message
            or "配送" in message
            or extract_order_no(message)
        ):
            updates["intent"] = detected
        else:
            updates["intent"] = "MEDICAL"
    else:
        updates["intent"] = detected
    
    # 提取订单号
    extracted_order_no = extract_order_no(message)
    if extracted_order_no:
        updates["order_no"] = extracted_order_no
        if pending_action in {"ORDER_PICK", "REFUND_PICK", "SHIPPING_PICK"}:
            updates["pending_action"] = None
            updates["candidates"] = []
    
    return updates


def handle_pending_pick_node(state: GraphState) -> dict[str, Any]:
    """处理待选择的列表项.
    
    处理用户从列表中选择某一项的场景。
    """
    pending_action = state.get("pending_action")
    if pending_action not in {"ORDER_PICK", "REFUND_PICK", "SHIPPING_PICK"}:
        return {}
    
    candidates = state.get("candidates") or []
    idx = extract_pick_index(state.get("message") or "")
    
    if idx is None:
        return {}
    
    if idx > len(candidates):
        return {}
    
    picked = candidates[idx - 1]
    order_no = picked.get("orderNo") or picked.get("selectKey")
    
    if order_no:
        return {
            "order_no": str(order_no),
            "pending_action": None,
            "candidates": [],
        }
    
    return {}
