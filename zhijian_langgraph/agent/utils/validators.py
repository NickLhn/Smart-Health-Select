"""验证工具函数."""

from __future__ import annotations

from typing import Any


def is_confirm_text(text: str) -> bool:
    """判断是否为确认文本."""
    t = (text or "").strip().lower()
    return t in {"1", "确认", "确认下单", "是", "好的", "好", "可以", "ok", "okay"}


def is_cancel_text(text: str) -> bool:
    """判断是否为取消文本."""
    t = (text or "").strip().lower()
    return t in {"0", "取消", "取消下单", "否", "不", "不要", "算了"}


def has_value(value: Any) -> bool:
    """判断值是否有效（非 None 且非空字符串）."""
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    return True


def is_positive_int(value: Any) -> bool:
    """判断是否为正整数."""
    if value is None:
        return False
    try:
        v = int(value)
        return v > 0
    except (TypeError, ValueError):
        return False
