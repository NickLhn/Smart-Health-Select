"""退款格式化器."""

from __future__ import annotations

from typing import Any

from agent.utils import fmt_value, mask_txid
from agent.graph.formatters.common import StatusTextFormatter


class RefundFormatter:
    """退款信息格式化器."""
    
    def __init__(self):
        self.status_fmt = StatusTextFormatter()
    
    def format_detail(self, refund_apply: dict[str, Any], summary: dict[str, Any]) -> str:
        """格式化退款详情."""
        lines = [
            f"订单号：{fmt_value(refund_apply.get('orderNo'))}",
            f"退款申请状态：{fmt_value(refund_apply.get('statusText'))}",
            f"申请退款金额：{fmt_value(refund_apply.get('amount'))}",
            f"退款原因：{fmt_value(refund_apply.get('reason'))}",
            f"审核时间：{fmt_value(refund_apply.get('auditTime'))}",
            f"审核备注：{fmt_value(refund_apply.get('auditReason'))}",
            f"已退款：{'是' if summary.get('isRefunded') else '否'}",
            f"已退金额：{fmt_value(summary.get('refundedAmount'), default='0')}",
            f"退款出账时间：{fmt_value(summary.get('refundedAt'))}",
        ]
        return "\n".join(lines)
    
    def format_payment_list(self, payments: list[dict]) -> list[str]:
        """格式化退款流水列表."""
        lines = ["退款流水："]
        for pay in payments[:5]:
            line = "｜".join([
                f"- 时间：{fmt_value(pay.get('createTime'))}",
                f"金额：{fmt_value(pay.get('amount'), default='0')}",
                f"状态：{self.status_fmt.refund_payment_status(pay.get('status'))}",
                f"流水号：{fmt_value(mask_txid(pay.get('transactionId')))}",
            ])
            lines.append(line)
        return lines
    
    def next_step_tip(self, refund_apply: dict[str, Any], summary: dict[str, Any]) -> str:
        """获取退款下一步提示."""
        try:
            status = int(refund_apply.get("status"))
        except (TypeError, ValueError):
            return ""
        
        if status == 0:
            return "审核中：请耐心等待商家审核，审核通过后会发起退款出账。"
        if status == 1:
            if summary.get("isRefunded"):
                return "已退款：款项已原路退回，到账时间以支付渠道为准。"
            return "审核通过：退款处理中，出账后会显示退款流水与出账时间。"
        if status == 2:
            return "审核拒绝：可根据拒绝原因修改后重新申请，或联系客服处理。"
        return ""
    
    def format_list_item(self, item: dict[str, Any], index: int) -> str:
        """格式化退款列表项."""
        return f"{index}）{item.get('displayTitle')}"
