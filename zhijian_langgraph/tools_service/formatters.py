from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Optional


ORDER_STATUS_TEXT: dict[int, str] = {
    -1: "已取消",
    0: "待支付",
    1: "待发货",
    2: "待收货",
    3: "已完成",
    4: "售后中",
    5: "已退款",
    6: "已取消",
    7: "待审核",
    8: "待揽收",
    10: "待支付",
    20: "待接单",
    30: "已接单/配货中",
    40: "配送中",
    50: "已完成",
    60: "已取消",
    70: "已退款",
}

REFUND_APPLY_STATUS_TEXT: dict[int, str] = {
    0: "待审核",
    1: "审核通过",
    2: "审核拒绝",
}

DELIVERY_STATUS_TEXT: dict[int, str] = {
    0: "待接单",
    1: "配送中",
    2: "已送达",
    3: "已取消",
}


def to_iso(dt: Any) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return str(dt)


def to_decimal_str(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return format(value, "f")
    return str(value)


def mask_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    phone = str(phone).strip()
    if len(phone) < 7:
        return phone
    return f"{phone[:3]}****{phone[-4:]}"


def mask_address(address: Optional[str]) -> Optional[str]:
    if not address:
        return None
    address = str(address).strip()
    if len(address) <= 6:
        return address
    return f"{address[:6]}***"


def mask_credit_code(code: Optional[str]) -> Optional[str]:
    if not code:
        return None
    code = str(code).strip()
    if len(code) <= 8:
        return code
    return f"{code[:4]}****{code[-4:]}"
