"""订单格式化器."""

from __future__ import annotations

from typing import Any

from agent.utils import fmt_value, has_value
from agent.graph.formatters.common import StatusTextFormatter


class OrderFormatter:
    """订单信息格式化器."""
    
    def __init__(self):
        self.status_fmt = StatusTextFormatter()
    
    def format_detail(self, order: dict[str, Any], items: list[dict]) -> str:
        """格式化订单详情."""
        lines = [
            f"订单号：{fmt_value(order.get('orderNo'))}",
            f"状态：{fmt_value(order.get('statusText'))}",
            f"应付：{fmt_value(order.get('totalAmount'))}",
            f"优惠：{fmt_value(order.get('couponAmount'), default='0')}",
            f"实付：{fmt_value(order.get('payAmount'))}",
            f"下单时间：{fmt_value(order.get('createTime'))}",
            f"支付时间：{fmt_value(order.get('paymentTime'))}",
            f"发货时间：{fmt_value(order.get('deliveryTime'))}",
            f"完成时间：{fmt_value(order.get('finishTime'))}",
            f"收货人：{fmt_value(order.get('receiverName'))}",
            f"电话：{fmt_value(order.get('receiverPhoneMasked'))}",
            f"地址：{fmt_value(order.get('receiverAddressMasked'))}",
        ]
        
        # 可选字段
        if has_value(order.get("pickupCode")):
            lines.append(f"取货码：{fmt_value(order.get('pickupCode'))}")
        if has_value(order.get("receiveCode")):
            lines.append(f"收货码：{fmt_value(order.get('receiveCode'))}")
        if has_value(order.get("refundReason")):
            lines.append(f"退款原因：{fmt_value(order.get('refundReason'))}")
        
        # 下一步提示
        tip = self._next_step_tip(order)
        if tip:
            lines.append(f"提示：{tip}")
        
        # 商品列表
        if items:
            lines.append("商品：")
            for it in items[:5]:
                lines.append(
                    f"- {fmt_value(it.get('name'))} ×{fmt_value(it.get('quantity'))}"
                    f"（小计 {fmt_value(it.get('totalPrice'))}）"
                )
        
        return "\n".join(lines)
    
    def format_list_item(self, item: dict[str, Any], index: int) -> str:
        """格式化订单列表项.
        
        Returns:
            "1）商品名｜下单 2024-01-01"
        """
        return f"{index}）{item.get('displayTitle')}｜下单 {fmt_value(item.get('createTime'))}"
    
    def _next_step_tip(self, order: dict[str, Any]) -> str:
        """获取订单下一步提示."""
        try:
            status = int(order.get("status"))
        except (TypeError, ValueError):
            return ""
        
        mapping = {
            0: "待支付：请尽快完成支付，超时订单可能自动取消。",
            1: "待发货：商家正在配货/出库，发货后可在物流跟踪里查看配送进度。",
            2: "待收货：可发送“查物流 订单号”查看配送状态与轨迹。",
            3: "已完成：如有售后需求可发“查退款 订单号”查看退款进度。",
            4: "售后中：可发送“查退款 订单号”查看退款进度与退款流水。",
            5: "已退款：可发送“查退款 订单号”查看退款进度与退款流水。",
            6: "已取消：可重新下单。",
            7: "待审核：请耐心等待审核结果，审核通过后会继续发货流程。",
            10: "待支付：请尽快完成支付，超时订单可能自动取消。",
            20: "待接单：商家正在接单配货中，可稍后再查订单或物流。",
            30: "配货中：商家正在配货/出库，发货后可在物流跟踪里查看配送进度。",
            40: "配送中：可发送“查物流 订单号”查看配送状态与轨迹。",
            50: "已完成：如有售后需求可发“查退款 订单号”查看退款进度。",
            60: "已取消：可重新下单。",
            70: "已退款：可发送“查退款 订单号”查看退款进度与退款流水。",
        }
        
        # 优先检查药师审核状态
        pharmacist = int(order.get("pharmacistAuditStatus") or 0)
        if pharmacist == 1:
            return "药师审核中：处方药需要药师审核通过后才能发货，请耐心等待。"
        if pharmacist == 3:
            return "药师审核未通过：请检查处方信息或更换药品后重新下单。"
        
        return mapping.get(status, "")
