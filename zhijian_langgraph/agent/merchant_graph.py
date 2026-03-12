"""商家端 Graph（重构版）.

实际逻辑已拆分到 merchant/ 目录：
- merchant/states.py - 状态定义
- merchant/nodes/ - 节点函数
- merchant/router.py - 路由
- merchant/builder.py - Graph 构建

保留此文件是为了向后兼容。
"""

from __future__ import annotations

from agent.merchant.states import MerchantGraphState, MerchantCandidate, MerchantIntent
from agent.merchant.builder import build_merchant_graph

__all__ = [
    "MerchantGraphState",
    "MerchantCandidate",
    "MerchantIntent",
    "build_merchant_graph",
]
