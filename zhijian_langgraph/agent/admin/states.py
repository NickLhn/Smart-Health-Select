"""管理员端 Graph 状态定义."""

from __future__ import annotations

from typing import Any, Literal, Optional, TypedDict

AdminIntent = Literal["USER_QUERY", "USER_STATUS", "MERCHANT", "MEDICINE", "ORDER", "OTHER"]


class AdminCandidate(TypedDict, total=False):
    """管理员端候选项定义."""
    type: str
    userId: int
    username: str
    nickname: str
    mobile: str
    status: int
    createTime: str
    merchantId: int
    shopName: str
    contactName: str
    contactPhone: str
    auditStatus: int
    materialsComplete: bool
    missingMaterials: list[str]
    medicineId: int
    name: str
    stock: int
    price: str
    status: int
    orderId: int
    orderNo: str
    totalAmount: str
    payAmount: str
    sellerId: int
    aftersalesId: int
    refundStatus: int
    refundType: int
    refundAmount: str


class AdminGraphState(TypedDict, total=False):
    """管理员端 Graph 状态定义."""
    message: str
    token: str
    request_id: Optional[str]
    intent: AdminIntent
    pending_action: str | None
    candidates: list[AdminCandidate]
    admin_user_status_draft: dict[str, Any] | None
    admin_merchant_audit_draft: dict[str, Any] | None
    admin_merchant_last_id: int | None
    admin_medicine_last_id: int | None
    admin_medicine_status_draft: dict[str, Any] | None
    admin_medicine_delete_draft: dict[str, Any] | None
    admin_order_last_id: int | None
    admin_aftersales_last_id: int | None
    admin_aftersales_audit_draft: dict[str, Any] | None
    reply: str
    cards: list[dict[str, Any]]
