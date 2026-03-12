"""管理员端 Graph（重构版）.

实际逻辑已拆分到 admin/ 目录：
- admin/states.py - 状态定义
- admin/nodes/ - 节点函数
- admin/router.py - 路由
- admin/builder.py - Graph 构建

保留此文件是为了向后兼容。
"""

from __future__ import annotations

from agent.admin.states import AdminGraphState, AdminCandidate, AdminIntent
from agent.admin.builder import build_admin_graph

__all__ = [
    "AdminGraphState",
    "AdminCandidate",
    "AdminIntent",
    "build_admin_graph",
]
