"""商家端 Graph 状态定义."""

from __future__ import annotations

from typing import Any, Literal, Optional, TypedDict

# 商家端意图类型
MerchantIntent = Literal[
    "SHOP_OVERVIEW",
    "DIAGNOSIS",
    "DASHBOARD_SUMMARY",
    "INVENTORY_RISK",
    "INVENTORY_FORECAST",
    "CONVERSION_ADVICE",
    "MEDICINE_MGMT",
    "ORDERS_PENDING",
    "ORDERS_LIST",
    "ORDER_DETAIL",
    "SALES_TREND",
    "TOP_PRODUCTS",
    "REFUND_LIST",
    "REFUND_SUMMARY",
    "COMPLIANCE_QA",
    "OTHER",
]


class MerchantCandidate(TypedDict, total=False):
    """商家端候选项定义."""
    type: str
    orderNo: str
    refundNo: str
    productId: int
    medicineId: int
    name: str
    amount: str
    reason: str
    sales: int
    gmv: str
    price: float
    stock: int
    specs: str
    status: int
    mainImage: str


class MerchantGraphState(TypedDict, total=False):
    """商家端 Graph 状态.
    
    Attributes:
        message: 用户消息
        token: 认证token
        request_id: 请求追踪ID
        intent: 意图
        pending_action: 待处理动作
        pending_intent: 待处理意图（用于时间范围选择）
        time_range_override: 时间范围覆盖
        candidates: 候选项列表
        picked_refund: 选中的退款
        picked_product: 选中的商品
        picked_conv_product: 选中的转化建议商品
        order_no: 订单号
        medicine_draft: 药品操作草稿
        last_medicine_id: 最后操作的药品ID
        reply: 回复内容
        cards: 卡片数据
    """
    message: str
    token: str
    request_id: Optional[str]
    intent: MerchantIntent
    pending_action: str | None
    pending_intent: MerchantIntent
    time_range_override: str
    candidates: list[MerchantCandidate]
    picked_refund: MerchantCandidate
    picked_product: MerchantCandidate
    picked_conv_product: MerchantCandidate
    order_no: str
    medicine_draft: dict[str, Any] | None
    last_medicine_id: int | None
    reply: str
    cards: list[dict[str, Any]]
