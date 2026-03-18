"""Graph 状态定义."""

from __future__ import annotations

from typing import Any, Literal, Optional, TypedDict

# 意图类型定义
Intent = Literal[
    "ORDER", "REFUND", "SHIPPING", "MEDICAL", "MEDICINE", "PURCHASE", "OTHER"
]


class Candidate(TypedDict, total=False):
    """候选项定义."""
    selectKey: str
    orderNo: str
    medicineId: int
    name: str


class GraphState(TypedDict, total=False):
    """Graph 状态定义.
    
    Attributes:
        message: 用户消息
        token: 用户认证 token
        user_id: 用户ID
        request_id: 请求追踪ID
        intent: 识别出的意图
        pending_action: 待处理动作
        candidates: 候选列表（用于选择）
        order_no: 订单号
        purchase_draft: 购买草稿（用于确认流程）
        last_medicine_id: 最后操作的药品ID
        reply: 回复内容
        cards: 卡片数据
        action: 前端动作
        history: 对话历史
        user_profile: 用户画像
    """
    message: str
    token: str
    user_id: Optional[str]
    request_id: Optional[str]
    intent: Intent
    pending_action: str | None
    candidates: list[Candidate]
    order_no: str
    purchase_draft: dict[str, Any] | None
    last_medicine_id: int | None
    reply: str
    cards: list[dict[str, Any]]
    action: dict[str, Any] | None
    history: list[dict[str, Any]]
    user_profile: dict[str, Any] | None
    conversation_summary: dict[str, Any] | None
