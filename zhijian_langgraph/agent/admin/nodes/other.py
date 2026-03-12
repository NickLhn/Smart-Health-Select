"""管理员端默认回复节点."""

from __future__ import annotations

from typing import Any

from agent.admin.states import AdminGraphState


def other_flow_node(state: AdminGraphState) -> dict[str, Any]:
    """默认回复."""
    return {
        "reply": "管理员指令：\n- 用户查询/禁用/启用\n- 商家审核\n- 药品管理（上架/下架/删除）\n- 订单查询\n- 售后审核"
    }
