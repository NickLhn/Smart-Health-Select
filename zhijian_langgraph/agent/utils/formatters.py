"""格式化工具函数."""

from __future__ import annotations

from typing import Any, Optional


def fmt_value(value: Any, default: str = "暂无") -> str:
    """格式化值，处理 None 和空字符串."""
    if value is None:
        return default
    if isinstance(value, str) and not value.strip():
        return default
    return str(value)


def mask_phone(value: Any) -> str:
    """手机号脱敏."""
    if value is None:
        return ""
    text = str(value).strip()
    if len(text) < 7:
        return text
    return f"{text[:3]}****{text[-4:]}"


def mask_txid(value: Any) -> Any:
    """交易号脱敏."""
    if value is None:
        return None
    if not isinstance(value, str):
        return value
    text = value.strip()
    if len(text) <= 12:
        return text
    return f"{text[:6]}...{text[-4:]}"


def format_kv(rows: list[list[Any]]) -> str:
    """格式化键值对列表.
    
    Args:
        rows: [[key, value], ...]
    
    Returns:
        "key：value\nkey：value"
    """
    lines: list[str] = []
    for r in rows:
        if not r:
            continue
        k = str(r[0])
        v = "-" if len(r) < 2 or r[1] is None or str(r[1]).strip() == "" else str(r[1])
        lines.append(f"{k}：{v}")
    return "\n".join(lines) if lines else ""


def format_lines(title: str, lines: list[str]) -> str:
    """格式化带标题的文本块.
    
    Args:
        title: 标题
        lines: 内容行列表
    
    Returns:
        格式化后的文本
    """
    body = "\n".join([ln for ln in lines if (ln or "").strip()])
    if not title:
        return body
    if not body:
        return title
    return f"{title}\n{body}"


def format_list(items: list[str], prefix: str = "") -> str:
    """格式化列表项."""
    if not items:
        return ""
    lines = [f"{prefix}{item}" for item in items if item]
    return "\n".join(lines)
