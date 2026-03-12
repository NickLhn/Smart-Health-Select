"""商家端转化建议节点."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from agent.merchant.states import MerchantGraphState
    from agent.tools_client import ToolsClient


def _build_tools_client(settings=None):
    from agent.tools_client import ToolsClient
    from agent.settings import load_settings
    if settings is None:
        settings = load_settings()
    return ToolsClient(settings)


def _error_reply(payload, fallback):
    if payload.get("success", True):
        return None
    status_code = payload.get("status_code")
    if status_code == 403:
        return {"reply": "无权限访问商家工具，请使用商家账号登录。"}
    if status_code == 401:
        return {"reply": "登录已过期，请重新登录后再试。"}
    if status_code == 404:
        return {"reply": fallback}
    return {"reply": "工具服务暂时不可用，请稍后再试。"}


def conversion_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """转化优化建议."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法给出转化建议。"}
    
    # 检查是否已选中商品
    picked = state.get("picked_conv_product")
    if isinstance(picked, dict) and picked.get("name"):
        return _give_advice_for_product(picked)
    
    msg = (state.get("message") or "").strip()
    
    # 提取关键词
    keyword = _extract_product_keyword(msg)
    if not keyword and state.get("pending_action") == "CONV_NEED_PRODUCT":
        keyword = msg.strip()
    
    if not keyword:
        return _general_conversion_advice(state)
    
    # 搜索商品
    tools = _build_tools_client(load_settings())
    payload = tools.merchant_products_search(token, keyword=keyword, limit=5, request_id=request_id)
    err = _error_reply(payload, f'没找到"{keyword}"相关商品。')
    if err:
        return {**err, "pending_action": "CONV_NEED_PRODUCT"}
    
    items = (payload.get("data") or {}).get("items") or []
    if not isinstance(items, list) or not items:
        return {
            "pending_action": "CONV_NEED_PRODUCT",
            "reply": f'没找到"{keyword}"相关商品。你可以换个关键词（例如：布洛芬/创可贴）或发商品ID。',
        }
    
    # 精确匹配或只有一个结果
    exact = _find_exact_match(items, keyword)
    if exact:
        return _give_advice_for_product(exact)
    
    # 多个结果，让用户选择
    candidates = []
    lines = ["找到多个匹配商品（回复序号选择后给出转化建议）："]
    for i, it in enumerate(items[:5], start=1):
        candidates.append({
            "type": "product",
            "productId": int(it.get("id") or 0),
            "name": str(it.get("name") or ""),
            "price": float(it.get("price") or 0),
            "stock": int(it.get("stock") or 0),
        })
        lines.append(f"{i}）{it.get('name')}｜¥{it.get('price')}｜库存{it.get('stock')}；")
    
    return {
        "pending_action": "CONV_PRODUCT_PICK",
        "candidates": candidates,
        "reply": "\n".join(lines),
    }


def _extract_product_keyword(msg: str) -> str | None:
    """从消息中提取商品关键词."""
    # 匹配【商品名】
    m = re.search(r"[【\[]([^】\]]{1,40})[】\]]", msg)
    if m:
        return (m.group(1) or "").strip()
    
    # 匹配 "商品: xxx"
    m2 = re.search(r"商品[:：\s]*([^\s，,。.!！?？（）()]{1,30})", msg)
    if m2:
        return m2.group(1).strip().strip("【】[]")
    
    # 匹配 "xxx的转化"
    if "转化" in msg:
        left = re.split(r"(的)?转化", msg, maxsplit=1)[0]
        return left.strip(" ：:，,。.!！?？（）()\"'【】[]")
    
    return None


def _find_exact_match(items, keyword):
    """查找精确匹配的商品."""
    for it in items:
        if not isinstance(it, dict):
            continue
        name = str(it.get("name") or "")
        if name and (keyword in name or name in keyword):
            return it
    if len(items) == 1:
        return items[0]
    return None


def _give_advice_for_product(product: dict) -> dict[str, Any]:
    """为指定商品给出转化建议."""
    name = product.get("name") or ""
    price = product.get("price")
    stock = product.get("stock")
    specs = product.get("specs") or ""
    
    base = [
        f"转化优化建议（商品：{name}）：",
        f"基础信息：{('规格' + specs) if specs else '规格—'}｜¥{price}｜库存{stock}",
        "主图：1）首图明确'品名+规格+数量/片数/尺寸'；2）增加场景图（出行/家庭/户外）与卖点对比；3）注意字号清晰、避免小字堆叠。",
        "标题：建议结构=品牌/品名+规格/数量+核心卖点（透气/防水/独立包装等）+适用场景；避免'最/第一/100%'等绝对化词。",
        "详情页：1）3秒说明白适用人群与场景；2）把'规格/材质/贴合度/过敏提示'做成表格；3）展示资质/售后/发货时效提升信任。",
        "如果你把当前标题/主图文案/详情卖点发我，我可以按你的现状逐条改写。",
    ]
    
    return {
        "reply": "\n".join(base),
        "pending_action": None,
        "picked_conv_product": {},
    }


def _general_conversion_advice(state) -> dict[str, Any]:
    """通用转化建议."""
    return {
        "pending_action": "CONV_NEED_PRODUCT",
        "reply": "\n".join([
            "提升转化建议（通用）：",
            "主图：1）首图突出核心卖点/规格/数量；2）对比图/场景图提升理解；3）统一风格、避免小字难读。",
            "标题：1）品牌+品名+规格+关键功效；2）包含高频搜索词；3）避免堆叠无关词与违禁词。",
            "详情页：1）3秒说明白适用人群/功效；2）用法用量/禁忌醒目；3）资质/售后/配送承诺增强信任。",
            "——",
            "把商品名发我（例如：创可贴），我会按该商品给更针对的建议。",
        ]),
    }
