"""商家端意图分类器."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agent.merchant.states import MerchantIntent


def classify_merchant_intent(text: str) -> "MerchantIntent":
    """商家端意图分类.
    
    Args:
        text: 用户输入
    
    Returns:
        意图类型
    """
    t = text or ""
    
    # 药品管理
    if any(k in t for k in ["药品", "商品", "药品库", "上架", "下架", "删除"]):
        if any(k in t for k in ["药品", "商品", "药品库", "上架", "下架", "删除", "查看", "详情", "列表", "搜索"]):
            return "MEDICINE_MGMT"
    
    # 经营概览
    if "经营概览" in t or ("概览" in t and all(k in t for k in ["订单", "销售", "售后", "库存"])):
        return "SHOP_OVERVIEW"
    
    # 经营诊断
    if any(k in t for k in ["经营诊断", "原因分析", "下滑原因", "上涨原因", "为什么", "诊断"]):
        return "DIAGNOSIS"
    
    # 合规
    if any(k in t for k in ["合规", "广告法", "违禁词", "敏感词", "处方药宣传", "OTC宣传", "话术"]):
        return "COMPLIANCE_QA"
    
    # 库存预测
    if any(k in t for k in ["可售天数", "库存预测", "库存周转", "周转天数", "补货建议"]):
        return "INVENTORY_FORECAST"
    
    # 库存风险
    if any(k in t for k in ["库存", "补货", "缺货", "低库存"]):
        return "INVENTORY_RISK"
    
    # 转化建议
    if any(k in t for k in ["转化", "主图", "标题", "详情页", "详情"]):
        return "CONVERSION_ADVICE"
    
    # 待处理订单
    if "待处理" in t:
        return "ORDERS_PENDING"
    
    # 待发货订单
    if any(k in t for k in ["待发货", "未发货", "发货单"]):
        return "ORDERS_LIST"
    
    # 退款列表
    if any(k in t for k in ["退款列表", "售后列表", "售后单", "退款单列表"]):
        return "REFUND_LIST"
    
    # 退款汇总
    if any(k in t for k in ["退款", "售后", "退货", "退款率", "退款原因"]):
        return "REFUND_SUMMARY"
    
    # 销售趋势
    if any(k in t for k in ["趋势", "走势", "曲线"]):
        return "SALES_TREND"
    
    # 热销排行
    if any(k in t for k in ["热销", "排行", "Top", "TOP", "卖得最好", "爆款"]):
        return "TOP_PRODUCTS"
    
    # 数据看板
    if any(k in t for k in ["订单量", "销售额", "成交额", "GMV", "概览"]):
        if any(k in t for k in ["今天", "今日", "昨天", "近"]):
            return "DASHBOARD_SUMMARY"
    
    # 订单详情
    if "订单" in t and ("详情" in t or _extract_order_no(t)):
        return "ORDER_DETAIL"
    
    return "OTHER"


def _extract_order_no(text: str) -> str | None:
    """提取订单号."""
    import re
    s = (text or "").strip()
    m = re.search(r"\b(\d{12,})\b", s)
    if not m:
        return None
    return m.group(1)
