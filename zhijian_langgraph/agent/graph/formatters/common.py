"""通用状态格式化器."""

from __future__ import annotations

from typing import Any


class StatusTextFormatter:
    """状态文本格式化器."""
    
    @staticmethod
    def medicine_status(value: Any) -> str:
        """药品状态：0=下架，1=上架."""
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        return "上架" if v == 1 else ("下架" if v == 0 else str(v))
    
    @staticmethod
    def order_status(value: Any) -> str:
        """订单状态."""
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        mapping = {
            -1: "已取消",
            0: "待支付",
            1: "待发货",
            2: "已发货",
            3: "已完成",
            4: "售后中",
            5: "已退款",
            6: "已取消",
            7: "待审核",
        }
        return mapping.get(v, str(v))
    
    @staticmethod
    def refund_status(value: Any) -> str:
        """退款状态：0=待审核，1=已通过，2=已拒绝."""
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        if v == 0:
            return "待审核"
        if v == 1:
            return "已通过"
        if v == 2:
            return "已拒绝"
        return str(v)
    
    @staticmethod
    def refund_type(value: Any) -> str:
        """退款类型：1=仅退款，2=退货退款."""
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        if v == 1:
            return "仅退款"
        if v == 2:
            return "退货退款"
        return str(v)
    
    @staticmethod
    def refund_payment_status(value: Any) -> str:
        """退款支付状态."""
        try:
            status = int(value)
        except (TypeError, ValueError):
            return str(value)
        mapping = {0: "未支付", 1: "支付成功", 2: "支付失败", 3: "已退款"}
        return mapping.get(status, str(status))
    
    @staticmethod
    def user_status(value: Any) -> str:
        """用户状态：0=禁用，1=正常."""
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        return "正常" if v == 1 else "禁用" if v == 0 else str(v)
    
    @staticmethod
    def merchant_audit_status(value: Any) -> str:
        """商家审核状态."""
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        if v == 0:
            return "待审核"
        if v == 1:
            return "已通过"
        if v == 2:
            return "已驳回"
        return str(v)
