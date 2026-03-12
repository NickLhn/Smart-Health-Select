"""商家端默认回复节点."""

from __future__ import annotations

from typing import Any

from agent.merchant.states import MerchantGraphState


def other_flow_node(state: MerchantGraphState) -> dict[str, Any]:
    """默认回复."""
    return {
        "reply": "你可以问我：\n- 经营概览/诊断\n- 订单查询/待处理\n- 退款查询\n- 库存风险/预测\n- 销售趋势/热销排行\n- 转化优化建议\n- 合规话术\n- 药品管理（上架/下架/删除）"
    }
