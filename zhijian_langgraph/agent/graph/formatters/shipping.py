"""物流格式化器."""

from __future__ import annotations

from typing import Any

from agent.utils import fmt_value, has_value


class ShippingFormatter:
    """物流信息格式化器."""
    
    def format_detail(self, delivery: dict[str, Any]) -> str:
        """格式化物流详情."""
        lines = [
            f"订单号：{fmt_value(delivery.get('orderNo'))}",
            f"配送状态：{fmt_value(delivery.get('statusText'))}",
            f"订单状态：{fmt_value(delivery.get('orderStatusText'))}",
            f"店铺：{fmt_value(delivery.get('shopName'))}",
            f"店铺地址：{fmt_value(delivery.get('shopAddress'))}",
            f"骑手：{fmt_value(delivery.get('courierName'))}",
            f"骑手电话：{fmt_value(delivery.get('courierPhoneMasked'))}",
            f"收货人：{fmt_value(delivery.get('receiverName'))}",
            f"收货电话：{fmt_value(delivery.get('receiverPhoneMasked'))}",
            f"收货地址：{fmt_value(delivery.get('receiverAddressMasked'))}",
            f"配送费：{fmt_value(delivery.get('deliveryFee'))}",
            f"异常原因：{fmt_value(delivery.get('exceptionReason'))}",
            f"更新时间：{fmt_value(delivery.get('updateTime'))}",
        ]
        
        # 急单提示
        if int(delivery.get("isUrgent") or 0) == 1:
            lines.append("提示：该订单为急单，配送会优先处理。")
        
        # 验证码和凭证
        if has_value(delivery.get("verifyCode")):
            lines.append(f"签收验证码：{fmt_value(delivery.get('verifyCode'))}")
        if has_value(delivery.get("proofImageUrl")):
            lines.append(f"送达凭证：{fmt_value(delivery.get('proofImageUrl'))}")
        
        # 配送轨迹
        track = delivery.get("track") or []
        if isinstance(track, list) and track:
            lines.append("配送轨迹：")
            for node in track[:8]:
                if isinstance(node, dict):
                    lines.append(f"- {fmt_value(node.get('time'))} {fmt_value(node.get('text'))}")
        
        return "\n".join(lines)
    
    def format_list_item(self, item: dict[str, Any], index: int) -> str:
        """格式化物流列表项."""
        return f"{index}）{item.get('displayTitle')}"
