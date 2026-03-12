"""意图分类器."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.graph.states import Intent


def classify_intent(text: str) -> "Intent":
    """基于关键词的意图分类.
    
    Args:
        text: 用户输入文本
    
    Returns:
        意图类型
    """
    text = text or ""
    
    # 药品相关
    if any(k in text for k in ["药品列表", "药品库", "搜索药品", "查药品", "查询药品", "查看药品", "药品详情"]):
        return "MEDICINE"
    
    # 药品管理操作
    if any(text.strip().startswith(k) for k in ["查看 ", "上架 ", "下架 ", "删除 "]):
        if any(k in text for k in ["药品", "商品"]):
            return "MEDICINE"
    
    # 购买相关
    if re.search(
        r"(?:^|[\s，。！？,.!?\-])(?:帮我|请|我要|我想)?\s*(?:下单|购买|买)\s*[\u4e00-\u9fa5A-Za-z0-9]",
        text
    ):
        return "PURCHASE"
    
    # 退款相关
    if "退款" in text:
        return "REFUND"
    
    # 物流相关
    if "物流" in text or "配送" in text:
        return "SHIPPING"
    
    # 用药咨询
    if (
        "用药" in text
        or "药" in text
        or "头疼" in text
        or "发烧" in text
        or "感冒" in text
        or "咳嗽" in text
        or "腹泻" in text
        or "创可贴" in text
        or "纱布" in text
        or "扭伤" in text
        or "崴脚" in text
        or "拉伤" in text
    ):
        return "MEDICAL"
    
    # 订单相关（最后判断，因为比较宽泛）
    if "订单" in text or extract_order_no(text):
        return "ORDER"
    
    return "OTHER"


def extract_order_no(text: str) -> str | None:
    """提取订单号."""
    match = re.search(r"(?<!\d)\d{18,25}(?!\d)", text or "")
    if not match:
        return None
    return match.group(0)
