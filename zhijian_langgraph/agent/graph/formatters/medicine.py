"""药品格式化器."""

from __future__ import annotations

from typing import Any

from agent.utils import fmt_value
from agent.graph.formatters.common import StatusTextFormatter


class MedicineFormatter:
    """药品信息格式化器."""
    
    def __init__(self):
        self.status_fmt = StatusTextFormatter()
    
    def format_detail(self, data: dict[str, Any]) -> str:
        """格式化药品详情."""
        lines = [
            f"药品ID：{data.get('id')}",
            f"名称：{data.get('name')}",
            f"状态：{self.status_fmt.medicine_status(data.get('status'))}",
            f"价格：{data.get('price')}",
            f"库存：{data.get('stock')}",
        ]
        if data.get("specs"):
            lines.append(f"规格：{data.get('specs')}")
        if data.get("categoryName"):
            lines.append(f"分类：{data.get('categoryName')}")
        if data.get("mainImage"):
            lines.append(f"主图：{data.get('mainImage')}")
        
        medicine_id = data.get('id')
        lines.append(f"你可以说：购买 药品ID={medicine_id}")
        
        return "\n".join(lines)
    
    def format_list_item(self, item: dict[str, Any], index: int) -> str:
        """格式化药品列表项.
        
        Returns:
            "1. 药品ID=123 名称=xxx 状态=上架 价格=10.00 库存=100"
        """
        mid = item.get("id")
        name = item.get("name") or "-"
        price = item.get("price")
        stock = item.get("stock")
        status = self.status_fmt.medicine_status(item.get("status"))
        return f"{index}. 药品ID={mid} 名称={name} 状态={status} 价格={price} 库存={stock}"
    
    def format_preview(
        self,
        name: str,
        medicine_id: int,
        current_status: Any,
        to_status: Any,
        action: str = "状态变更"
    ) -> str:
        """格式化操作预览."""
        return "\n".join([
            "【预览】",
            f"药品：{name or '-'}（ID={medicine_id}）",
            f"当前状态：{self.status_fmt.medicine_status(current_status)}",
            f"目标状态：{self.status_fmt.medicine_status(to_status)}" if to_status is not None else f"操作：{action}",
            "请回复 1 确认执行 / 0 取消",
        ])
