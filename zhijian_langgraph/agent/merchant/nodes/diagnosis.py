"""商家端经营诊断节点."""

from __future__ import annotations

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


def _time_range_from_text(text, default="today"):
    t = text or ""
    if "昨天" in t:
        return "yesterday"
    if "近7" in t or "最近7" in t or "一周" in t:
        return "last7"
    if "近30" in t or "最近30" in t or "一个月" in t or "30天" in t:
        return "last30"
    if "今天" in t or "今日" in t:
        return "today"
    return default


def _has_explicit_time_range(text):
    t = text or ""
    return any(k in t for k in ["今天", "今日", "昨天", "近7", "最近7", "一周", "近30", "最近30", "30天", "一个月"])


def _ask_time_range(next_intent):
    return {
        "pending_action": "TIME_RANGE_PICK",
        "pending_intent": next_intent,
        "cards": [],
        "reply": "看哪个时间范围？回复：1=今天；2=近7天；3=近30天",
    }


def diagnosis_flow_node(state: "MerchantGraphState") -> dict[str, Any]:
    """经营诊断."""
    from agent.settings import load_settings
    
    token = state.get("token") or ""
    request_id = state.get("request_id") or None
    if not token:
        return {"reply": "缺少登录token，无法做经营诊断。"}
    
    tools = _build_tools_client(load_settings())
    
    msg = state.get("message") or ""
    if state.get("time_range_override"):
        tr = state["time_range_override"]
    else:
        if not _has_explicit_time_range(msg):
            return _ask_time_range("DIAGNOSIS")
        tr = _time_range_from_text(msg, default="today")
    
    payload = tools.merchant_diagnosis_overview(token, time_range=tr, request_id=request_id)
    err = _error_reply(payload, "暂无诊断数据。")
    if err:
        return err
    
    data = payload.get("data") or {}
    cur = data.get("current") or {}
    prev = data.get("previous") or {}
    delta = data.get("delta") or {}
    
    def fmt_pct(v):
        if v is None:
            return "—"
        try:
            return f"{float(v) * 100:.1f}%"
        except Exception:
            return "—"
    
    reply_lines = [
        f"经营诊断（{tr} vs 上一周期）：",
        f"支付订单：{cur.get('ordersPaid', 0)}（对比{prev.get('ordersPaid', 0)}，{fmt_pct(delta.get('ordersPaidPct'))}）",
        f"GMV：¥{cur.get('gmv') or '0.00'}（对比¥{prev.get('gmv') or '0.00'}，{fmt_pct(delta.get('gmvPct'))}）",
        f"客单价：¥{cur.get('aov') or '0.00'}（对比¥{prev.get('aov') or '0.00'}，{fmt_pct(delta.get('aovPct'))}）",
    ]
    
    # 生成建议
    advice = []
    try:
        orders_pct = delta.get("ordersPaidPct")
        gmv_pct = delta.get("gmvPct")
        aov_pct = delta.get("aovPct")
        
        if orders_pct is not None and float(orders_pct) < -0.1:
            advice.append("订单下滑明显：优先排查曝光/流量入口、活动承接、是否有热销商品断货。")
        if aov_pct is not None and float(aov_pct) < -0.1:
            advice.append("客单下降：检查是否低价SKU占比上升，建议做加购/凑单、组合装、满减券。")
        if orders_pct is not None and float(orders_pct) > 0.1 and aov_pct is not None and float(aov_pct) < -0.1:
            advice.append("订单增长但客单下降：流量结构可能偏低价，建议优化高毛利SKU曝光。")
        if gmv_pct is not None and float(gmv_pct) > 0.1:
            advice.append("GMV上涨：关注履约与售后承接，避免因延迟发货导致差评/退款。")
    except Exception:
        pass
    
    if advice:
        reply_lines.append("——")
        reply_lines.extend(advice[:4])
    
    return {"reply": "\n".join(reply_lines)}
