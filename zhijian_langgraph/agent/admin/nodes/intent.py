"""管理员端意图分类器."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.admin.states import AdminIntent


def classify_admin_intent(text: str) -> "AdminIntent":
    """管理员端意图分类."""
    t = text or ""
    
    # 药品管理
    if any(t.strip().startswith(k) for k in ["上架", "下架", "删除"]):
        return "MEDICINE"
    
    # 订单相关
    if any(k in t for k in ["订单列表", "查询订单", "搜索订单", "订单号", "订单明细", "订单详情"]):
        return "ORDER"
    if any(k in t for k in ["售后", "退款申请", "退款列表"]):
        return "ORDER"
    if any(k in t for k in ["待支付订单", "待发货订单", "已发货订单", "已完成订单", "售后订单", "退款订单", "已取消订单", "待审核订单"]):
        return "ORDER"
    
    # 药品查询
    if any(k in t for k in ["商品列表", "药品列表", "商品库", "药品库", "搜索商品", "搜索药品", "查药品", "查询药品"]):
        return "MEDICINE"
    
    # 用户查询
    if any(k in t for k in ["查用户", "查询用户", "搜索用户", "用户列表", "找用户"]):
        return "USER_QUERY"
    
    # 用户状态管理
    if any(k in t for k in ["禁用", "启用", "解禁", "恢复"]):
        return "USER_STATUS"
    
    # 商家管理
    if any(k in t for k in ["商家", "店铺", "入驻"]):
        return "MERCHANT"
    if any(k in t for k in ["待审核", "已通过", "已驳回"]) and any(k in t for k in ["列表", "查询", "搜索"]):
        return "MERCHANT"
    if any(t.strip().startswith(k) for k in ["查看", "通过", "驳回", "展开"]):
        return "MERCHANT"
    
    return "OTHER"
