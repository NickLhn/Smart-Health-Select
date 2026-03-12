"""用户端 Graph（重构版）.

该文件现在仅作为入口，实际逻辑已拆分到 graph/ 目录下的模块：
- graph/states.py - 状态定义
- graph/nodes/ - 节点函数
- graph/router.py - 路由逻辑
- graph/builder.py - Graph 构建
- graph/formatters/ - 格式化器

保留此文件是为了向后兼容，原有导入仍然有效。
"""

from __future__ import annotations

# 导出重构后的组件，保持向后兼容
from agent.graph.states import GraphState, Candidate, Intent
from agent.graph.builder import build_graph

# 为了保持向后兼容，保留原有的类型别名
__all__ = [
    "GraphState",
    "Candidate", 
    "Intent",
    "build_graph",
]

# 注意：如果需要使用原有的内部函数，请从对应模块导入：
# from agent.utils import extract_order_no, mask_phone, ...
# from agent.graph.nodes import classify_intent
