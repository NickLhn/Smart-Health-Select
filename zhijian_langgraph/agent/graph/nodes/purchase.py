"""购买流程节点."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

from agent.utils import is_confirm_text, is_cancel_text, mask_phone
from agent.utils.formatters import fmt_value

if TYPE_CHECKING:
    from agent.graph.states import GraphState
    from agent.tools_client import ToolsClient


def _build_tools_client(settings: Any = None) -> "ToolsClient":
    """构建工具客户端."""
    from agent.tools_client import ToolsClient
    from agent.settings import load_settings
    if settings is None:
        settings = load_settings()
    return ToolsClient(settings)


def extract_purchase_keyword(text: str) -> str | None:
    """提取购买关键词."""
    txt = (text or "").strip()
    # 首先尝试匹配包含下单/购买/买的模式
    m = re.search(r"(?:帮我|请|我要|我想)?\s*(?:下单|购买|买)\s*(?P<kw>.+)$", txt)
    if m:
        kw = (m.group("kw") or "").strip()
        kw = re.sub(r"[，。！？,.!?\s]+$", "", kw)
        kw = re.sub(r"^(一个|一盒|一包|一瓶|一件|一支|两盒|两包|两瓶|两件|两支)\s*", "", kw)
        kw = kw.strip()
        if kw and kw not in {"一下", "吧", "呢", "哈"}:
            return kw[:40]
    
    # 如果没有匹配到购买模式，检查是否是纯商品名称（没有动词的情况）
    # 这种情况只有在购物车为空时才处理
    # 这里返回原文本作为可能的商品名称
    if txt and len(txt) >= 2 and len(txt) <= 20:
        # 排除一些常见的问题词
        if txt not in {"好的", "是的", "ok", "OK", "嗯", "好", "可以", "知道了", "谢谢", "拜拜", "再见"}:
            return txt[:40]
    
    return None


def purchase_flow_node(state: "GraphState") -> dict[str, Any]:
    """购买下单流程."""
    from agent.settings import load_settings
    
    user_token = state.get("token") or ""
    request_id = state.get("request_id") or None
    message = state.get("message") or ""
    
    if not user_token:
        return {"reply": "缺少登录token，无法下单。"}
    
    tools = _build_tools_client(load_settings())
    
    # 处理确认流程
    if state.get("pending_action") == "PURCHASE_CONFIRM":
        return _handle_purchase_confirm(tools, state, user_token, request_id)
    
    # 检查购物车
    cart_payload = tools.get_cart_list(user_token, request_id=request_id)
    cart_items = (cart_payload.get("data") or {}).get("items") or [] if cart_payload.get("success", True) else []
    
    # 购物车为空，尝试搜索添加
    if not isinstance(cart_items, list) or not cart_items:
        return _handle_empty_cart(tools, state, user_token, message, request_id)
    
    # 购物车有商品，直接结算
    return _handle_cart_checkout(tools, user_token, cart_items, request_id)


def _handle_purchase_confirm(
    tools: "ToolsClient",
    state: "GraphState",
    user_token: str,
    request_id: str | None,
) -> dict[str, Any]:
    """处理购买确认."""
    user_text = state.get("message") or ""
    
    if is_cancel_text(user_text):
        return {
            "intent": "PURCHASE",
            "pending_action": None,
            "purchase_draft": None,
            "action": None,
            "reply": "已取消下单。如需购买，请前往购物车结算页操作。",
        }
    
    if not is_confirm_text(user_text):
        return {
            "intent": "PURCHASE",
            "pending_action": "PURCHASE_CONFIRM",
            "reply": "请回复 1 确认下单，或回复 0 取消。",
        }
    
    draft = state.get("purchase_draft") or {}
    if not isinstance(draft, dict) or not draft:
        return {
            "intent": "PURCHASE",
            "pending_action": None,
            "purchase_draft": None,
            "reply": "下单信息已失效，请重新发起下单。",
        }
    
    # 调用下单接口
    payload = tools.create_order_from_cart(user_token, draft, request_id=request_id)
    
    if not payload.get("success", True):
        err = payload.get("error") or ""
        if isinstance(err, str) and err:
            if "处方药" in err and ("就诊人" in err or "处方" in err):
                return {
                    "intent": "PURCHASE",
                    "pending_action": None,
                    "purchase_draft": None,
                    "action": {"type": "NAVIGATE", "url": "/order/checkout", "replace": False},
                    "reply": "检测到处方药下单需要补充就诊人与处方信息，已为你跳转到结算页，请在结算页补全信息后提交并支付。",
                }
            return {
                "intent": "PURCHASE",
                "pending_action": None,
                "purchase_draft": None,
                "reply": f"下单失败：{err}",
            }
        return {
            "intent": "PURCHASE",
            "pending_action": None,
            "purchase_draft": None,
            "reply": "下单失败，请稍后再试或前往购物车结算页操作。",
        }
    
    # 调试日志
    data = payload.get("data")
    order_ids = (data or {}).get("orderIds") if isinstance(data, dict) else (data or [])
    
    first_id = None
    if isinstance(order_ids, list) and order_ids:
        valid_ids = [x for x in order_ids if x is not None]
        if valid_ids:
            try:
                first_id = int(valid_ids[0])
            except (TypeError, ValueError):
                first_id = None
    
    reply_lines = ["订单创建成功。"]
    if isinstance(order_ids, list) and order_ids:
        valid_ids = [x for x in order_ids if x is not None]
        if valid_ids:
            reply_lines.append("订单ID：" + "，".join(str(x) for x in valid_ids[:10]))
        else:
            reply_lines.append("订单ID：暂无")
    
    if first_id is not None:
        reply_lines.append("请您手动跳转到收银台进行付款。")
    
    return {
        "intent": "PURCHASE",
        "pending_action": None,
        "purchase_draft": None,
        "action": None,
        "reply": "\n".join(reply_lines),
    }


def _handle_empty_cart(
    tools: "ToolsClient",
    state: "GraphState",
    user_token: str,
    message: str,
    request_id: str | None,
) -> dict[str, Any]:
    """处理空购物车（尝试搜索并添加）."""
    keyword = extract_purchase_keyword(message)
    if not keyword:
        return {"intent": "PURCHASE", "reply": "购物车为空，请先把商品加入购物车后再下单。"}
    
    # 搜索商品
    search_payload = tools.search_medicines(user_token, keyword, limit=5, request_id=request_id)
    if not search_payload.get("success", True):
        return {"intent": "PURCHASE", "reply": "暂时找不到该商品，请稍后再试或前往找药页添加后下单。"}
    
    items = (search_payload.get("data") or {}).get("items") or []
    if not isinstance(items, list) or not items:
        return {"intent": "PURCHASE", "reply": f'暂时没有找到"{keyword}"，你可以换个关键词或前往找药页添加后下单。'}
    
    # 选择最匹配的商品
    picked = None
    for it in items:
        if not isinstance(it, dict):
            continue
        name = str(it.get("name") or it.get("medicineName") or "")
        if name and keyword in name:
            picked = it
            break
    if picked is None:
        picked = items[0] if items else None
    
    if picked is None:
        return {"intent": "PURCHASE", "reply": f'暂时没有找到"{keyword}"，你可以换个关键词或前往找药页添加后下单。'}
    
    # 添加到购物车
    try:
        medicine_id = int(picked.get("id"))
    except (TypeError, ValueError):
        return {"intent": "PURCHASE", "reply": "商品数据异常，请前往找药页添加后下单。"}
    
    add_payload = tools.add_to_cart(user_token, medicine_id, count=1, request_id=request_id)
    if not add_payload.get("success", True):
        err_text = add_payload.get("error") or ""
        if isinstance(err_text, str) and err_text:
            return {"intent": "PURCHASE", "cards": items[:5], "reply": f'已找到"{keyword}"，但加入购物车失败：{err_text}'}
        return {"intent": "PURCHASE", "cards": items[:5], "reply": f'已找到"{keyword}"，但加入购物车失败，请稍后再试。'}
    
    # 重新获取购物车并结算
    cart_payload = tools.get_cart_list(user_token, request_id=request_id)
    cart_items = (cart_payload.get("data") or {}).get("items") or [] if cart_payload.get("success", True) else []
    if not isinstance(cart_items, list) or not cart_items:
        return {"intent": "PURCHASE", "reply": f'已尝试把"{keyword}"加入购物车，但购物车仍为空，请前往购物车查看后再下单。'}
    
    return _handle_cart_checkout(tools, user_token, cart_items, request_id)


def _handle_cart_checkout(
    tools: "ToolsClient",
    user_token: str,
    cart_items: list,
    request_id: str | None,
) -> dict[str, Any]:
    """处理购物车结算."""
    # 获取默认地址
    address_payload = tools.get_user_address_list(user_token, request_id=request_id)
    if not address_payload.get("success", True):
        return {"intent": "PURCHASE", "reply": "获取收货地址失败，请稍后再试。"}
    
    addresses = (address_payload.get("data") or {}).get("items") or []
    if not isinstance(addresses, list) or not addresses:
        return {"intent": "PURCHASE", "reply": "你还没有收货地址，请先在'个人中心-收货地址'新增后再下单。"}
    
    # 选择默认地址或第一个地址
    default_addr = None
    for addr in addresses:
        if isinstance(addr, dict) and int(addr.get("isDefault") or 0) == 1:
            default_addr = addr
            break
    if default_addr is None:
        default_addr = addresses[0]
    
    try:
        address_id = int(default_addr.get("id"))
    except (TypeError, ValueError):
        return {"intent": "PURCHASE", "reply": "收货地址数据异常，请前往结算页操作。"}
    
    # 构建购物车项和价格计算
    cart_item_ids: list[int] = []
    total_price = 0.0
    preview_lines: list[str] = []
    
    for it in cart_items:
        if not isinstance(it, dict):
            continue
        try:
            cid = int(it.get("id"))
        except (TypeError, ValueError):
            continue
        cart_item_ids.append(cid)
        
        name = str(it.get("medicineName") or it.get("name") or "")
        try:
            count = int(it.get("count") or it.get("quantity") or 0)
        except (TypeError, ValueError):
            count = 0
        try:
            price = float(it.get("price") or 0)
        except (TypeError, ValueError):
            price = 0.0
        
        total_price += price * max(0, count)
        if len(preview_lines) < 5 and name:
            preview_lines.append(f"- {name} ×{count}")
    
    if not cart_item_ids:
        return {"intent": "PURCHASE", "reply": "购物车数据异常，请前往结算页操作。"}
    
    # 构建确认信息
    receiver = str(default_addr.get("receiverName") or "")
    phone = mask_phone(default_addr.get("receiverPhone"))
    province = str(default_addr.get("province") or "")
    city = str(default_addr.get("city") or "")
    region = str(default_addr.get("region") or "")
    detail = str(default_addr.get("detailAddress") or "")
    address_text = f"{province}{city}{region}{detail}".strip()
    
    lines = [
        "我可以帮你用购物车商品创建订单，并跳转到收银台。",
        f"收货人：{receiver} {phone}".strip(),
        f"地址：{address_text}" if address_text else "地址：暂无",
        f"商品数量：{len(cart_item_ids)} 件",
        f"预估金额：¥{total_price:.2f}",
    ]
    if preview_lines:
        lines.append("商品预览：")
        lines.extend(preview_lines)
    lines.append("回复 1 确认下单，或回复 0 取消。")
    
    return {
        "intent": "PURCHASE",
        "pending_action": "PURCHASE_CONFIRM",
        "purchase_draft": {"cartItemIds": cart_item_ids, "addressId": address_id},
        "action": None,
        "reply": "\n".join(lines),
    }
