"""文本提取工具函数."""

from __future__ import annotations

import re
from typing import Optional


# 正则模式定义
_ORDER_NO_RE = re.compile(r"(?<!\d)\d{18,25}(?!\d)")
_MOBILE_RE = re.compile(r"(?<!\d)1\d{10}(?!\d)")


def extract_order_no(text: str) -> Optional[str]:
    """从文本中提取订单号（18-25位数字）."""
    match = _ORDER_NO_RE.search(text or "")
    if not match:
        return None
    return match.group(0)


def extract_pick_index(text: str) -> Optional[int]:
    """提取选择序号（纯数字，正整数）."""
    text = (text or "").strip()
    if not text.isdigit():
        return None
    try:
        value = int(text)
    except ValueError:
        return None
    if value <= 0:
        return None
    return value


def extract_pick_index_any(text: str) -> Optional[int]:
    """从文本中提取数字序号（更宽松）."""
    m = re.search(r"\b(\d{1,2})\b", (text or "").strip())
    if not m:
        return None
    try:
        v = int(m.group(1))
    except ValueError:
        return None
    return v if v > 0 else None


def extract_medicine_id(text: str) -> Optional[int]:
    """提取药品ID."""
    t = text or ""
    # 匹配 "药品id: 123" 或 "id=123"
    m = re.search(
        r"(?:药品id|药品ID|medicineId|medicineid|id|ID)\s*[:=：]?\s*(\d{1,18})",
        t,
        flags=re.IGNORECASE,
    )
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    # 匹配 "查看 123" 或 "上架 123"
    m2 = re.search(r"(?:查看|上架|下架|删除)\s*(\d{1,18})\b", t)
    if m2:
        try:
            return int(m2.group(1))
        except ValueError:
            return None
    return None


def extract_user_id(text: str) -> Optional[int]:
    """提取用户ID."""
    t = text or ""
    m = re.search(
        r"(?:userId|userid|用户id|用户ID|id|ID)\s*[:=：]?\s*(\d{1,18})",
        t,
        flags=re.IGNORECASE,
    )
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    # 匹配 "禁用用户 123"
    m2 = re.search(r"(?:禁用|启用|解禁|恢复)\s*(?:用户)?\s*(\d{1,18})\b", t)
    if m2:
        try:
            return int(m2.group(1))
        except ValueError:
            return None
    return None


def extract_merchant_id(text: str) -> Optional[int]:
    """提取商家ID."""
    t = text or ""
    m = re.search(
        r"(?:merchantId|merchantid|商家id|商家ID|店铺id|店铺ID|id|ID)\s*[:=：]?\s*(\d{1,18})",
        t,
        flags=re.IGNORECASE,
    )
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    # 匹配 "通过商家 123"
    m2 = re.search(r"(?:通过|驳回|查看|展开)\s*(?:商家)?\s*(\d{1,18})\b", t)
    if m2:
        try:
            return int(m2.group(1))
        except ValueError:
            return None
    return None


def extract_order_id(text: str) -> Optional[int]:
    """提取订单ID."""
    t = text or ""
    m = re.search(
        r"(?:订单id|订单ID|orderId|orderid|id|ID)\s*[:=：]?\s*(\d{1,18})",
        t,
        flags=re.IGNORECASE,
    )
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    # 匹配 "订单 123"
    m1 = re.search(r"(?:订单)\s*[:=：]?\s*(\d{1,18})\b", t)
    if m1:
        try:
            return int(m1.group(1))
        except ValueError:
            return None
    return None


def extract_aftersales_id(text: str) -> Optional[int]:
    """提取售后ID."""
    t = text or ""
    m = re.search(
        r"(?:售后id|售后ID|aftersalesId|refundId|id|ID)\s*[:=：]?\s*(\d{1,18})",
        t,
        flags=re.IGNORECASE,
    )
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    # 匹配 "售后 123"
    m1 = re.search(r"(?:售后|退款)\s*[:=：]?\s*(\d{1,18})\b", t)
    if m1:
        try:
            return int(m1.group(1))
        except ValueError:
            return None
    return None


def extract_mobile(text: str) -> Optional[str]:
    """提取手机号."""
    m = _MOBILE_RE.search(text or "")
    if not m:
        return None
    return m.group(0)


def extract_reason(text: str) -> Optional[str]:
    """提取原因/备注."""
    t = (text or "").strip()
    m = re.search(r"(?:原因|理由|备注)\s*[:：]\s*(.+)$", t)
    if not m:
        return None
    r = (m.group(1) or "").strip()
    if not r:
        return None
    return r[:200]


def extract_expand_field(text: str) -> Optional[str]:
    """提取展开字段."""
    t = (text or "").strip()
    m = re.search(r"展开\s*(?:商家)?\s*(?:id[:=：]?\s*\d+\s*)?(.+)$", t)
    if not m:
        return None
    f = (m.group(1) or "").strip()
    if not f:
        return None
    return f
