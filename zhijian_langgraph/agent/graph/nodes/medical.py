"""用药咨询流程节点."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

from agent.utils import has_value

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


# 症状到药品关键词的映射
SYMPTOM_MEDICINE_MAP: list[tuple[list[str], list[str]]] = [
    (["发热", "发烧", "感冒", "流感", "嗓子疼", "咽痛"], ["对乙酰氨基酚", "布洛芬", "连花清瘟", "板蓝根"]),
    (["头痛", "牙痛", "痛经", "关节痛", "偏头痛"], ["布洛芬", "对乙酰氨基酚"]),
    (["咳嗽", "咳痰", "痰多"], ["盐酸氨溴索", "复方甘草片"]),
    (["胃痛", "反酸", "烧心", "胃胀", "恶心", "呕吐"], ["奥美拉唑", "多潘立酮"]),
    (["腹泻", "腹痛", "肠胃炎"], ["藿香正气"]),
    (["高血压", "血压高", "心绞痛", "胸闷"], ["硝苯地平", "硝酸甘油", "电子血压计"]),
    (["血脂高", "胆固醇高"], ["阿托伐他汀"]),
    (["扭伤", "崴脚", "脚扭", "脚踝", "拉伤", "跌打", "扭了"], ["布洛芬", "对乙酰氨基酚", "医用纱布", "创可贴"]),
]

# 明确的药品关键词
EXPLICIT_MEDICINES = [
    "布洛芬", "对乙酰氨基酚", "阿莫西林", "头孢", "奥美拉唑", "多潘立酮",
    "盐酸氨溴索", "复方甘草片", "连花清瘟", "板蓝根", "藿香正气", "孟鲁司特",
    "硝苯地平", "阿托伐他汀", "硝酸甘油", "创可贴", "医用纱布", "电子体温计",
    "电子血压计", "血糖仪",
]


def medical_flow_node(state: "GraphState") -> dict[str, Any]:
    """用药咨询流程."""
    from agent.settings import load_settings
    
    user_token = state.get("token") or ""
    request_id = state.get("request_id") or None
    message = state.get("message") or ""
    
    if not user_token:
        return {"reply": "缺少登录token，无法进行用药推荐。"}
    
    tools = _build_tools_client(load_settings())
    
    # 紧急症状检测
    emergency_keywords = ["胸痛", "呼吸困难", "意识模糊", "抽搐", "持续高热", "呕血", "便血", "剧烈腹痛"]
    if any(k in message for k in emergency_keywords):
        return {"reply": "你的描述可能存在紧急风险，建议立即就医或拨打急救电话。若方便，请补充：年龄、体温、症状持续时间、既往病史与过敏史。"}
    
    # 创可贴使用说明
    if "创可贴" in message and any(k in message for k in ["怎么用", "如何", "使用", "贴"]):
        return _handle_bandage_guide(tools, user_token, request_id)
    
    # 扭伤处理
    injury_keywords = ["扭伤", "崴脚", "脚扭", "脚踝", "拉伤", "扭了"]
    if any(k in message for k in injury_keywords):
        return _handle_injury(tools, user_token, request_id)
    
    # 一般症状咨询
    return _handle_general_symptom(tools, user_token, message, request_id)


def _handle_bandage_guide(tools: "ToolsClient", user_token: str, request_id: str | None) -> dict[str, Any]:
    """处理创可贴使用指南."""
    payload = tools.search_medicines(user_token, "创可贴", limit=5, request_id=request_id)
    items = (payload.get("data") or {}).get("items") if payload.get("success", True) else []
    cards = items if isinstance(items, list) else []
    
    reply = """创可贴一般这样用：
- 先洗手，清水冲洗伤口，必要时用碘伏等消毒（避免把消毒液灌进深口）。
- 轻轻擦干伤口周围皮肤，让皮肤保持干燥。
- 撕开包装，避免手指触碰中间吸收垫；将吸收垫对准伤口贴上。
- 贴好后按压两侧胶布固定；若浸湿/变脏/松脱请及时更换。

注意：
- 伤口较深、持续出血、明显红肿流脓、动物咬伤/脏污伤口，建议就医处理。
- 对胶布过敏、皮肤破溃范围大，尽量改用纱布敷料。"""
    
    return {"reply": reply, "cards": cards[:5]}


def _handle_injury(tools: "ToolsClient", user_token: str, request_id: str | None) -> dict[str, Any]:
    """处理扭伤/崴脚."""
    supply_terms = ["弹力绷带", "护踝", "冰袋", "医用纱布", "创可贴"]
    cards: list[dict[str, Any]] = []
    seen_id: set[int] = set()
    
    for kw in supply_terms:
        payload = tools.search_medicines(user_token, kw, limit=5, request_id=request_id)
        if not payload.get("success", True):
            continue
        items = (payload.get("data") or {}).get("items") or []
        if not isinstance(items, list):
            continue
        
        for it in items:
            if not isinstance(it, dict):
                continue
            try:
                mid = int(it.get("id"))
            except (TypeError, ValueError):
                continue
            if mid in seen_id:
                continue
            seen_id.add(mid)
            cards.append(it)
            if len(cards) >= 5:
                break
        if len(cards) >= 5:
            break
    
    reply = """关于脚踝/脚部扭伤（崴脚），可以先这样处理：
- 休息：减少负重与活动，必要时使用拐杖/护踝固定。
- 冰敷：受伤后 24-48 小时内，每次 15-20 分钟，每天多次（不要直接冰贴皮肤）。
- 加压：弹力绷带适度加压包扎（避免过紧导致发麻/发紫）。
- 抬高：抬高患肢，帮助消肿。

建议尽快就医/拍片的情况：
- 不能站立负重、疼痛明显加重、明显畸形、麻木发凉、肿胀迅速加重，或 48 小时仍明显恶化。"""
    
    if cards:
        reply += "\n\n为你匹配到以下可能相关的用品/药品（点击可查看详情）："
    
    return {"reply": reply, "cards": cards}


def _handle_general_symptom(
    tools: "ToolsClient",
    user_token: str,
    message: str,
    request_id: str | None,
) -> dict[str, Any]:
    """处理一般症状咨询."""
    # 去除标点后的文本
    normalized = re.sub(r"[\s,，。.!！?？;；:：、/\\()\[\]{}<>\"'\-_=+~`|@#$%^&*]", "", message)
    if len(normalized) < 4:
        return {"reply": "请补充信息：年龄、主要症状（如发热/咳嗽/腹泻/头痛等）、是否发热及体温、过敏史、是否怀孕/哺乳、正在使用的药物。"}
    
    # 收集关键词
    keywords: list[str] = []
    
    # 1. 明确提到的药品
    for t in EXPLICIT_MEDICINES:
        if t in message:
            keywords.append(t)
    
    # 2. 根据症状推断
    for triggers, terms in SYMPTOM_MEDICINE_MAP:
        if any(t in message for t in triggers):
            keywords.extend(terms)
    
    # 去重
    seen_kw: set[str] = set()
    deduped_keywords: list[str] = []
    for kw in keywords:
        kw2 = (kw or "").strip()
        if not kw2 or kw2 in seen_kw:
            continue
        seen_kw.add(kw2)
        deduped_keywords.append(kw2)
    
    if not deduped_keywords:
        return {
            "reply": "我可以帮你做用药建议与商品推荐。请补充：年龄、主要症状、体温/是否发热、症状持续时间、过敏史、是否怀孕/哺乳、既往病史与正在使用的药物。",
            "cards": [],
        }
    
    # 搜索药品
    cards: list[dict[str, Any]] = []
    seen_id: set[int] = set()
    
    for kw in deduped_keywords[:6]:
        payload = tools.search_medicines(user_token, kw, limit=5, request_id=request_id)
        if not payload.get("success", True):
            continue
        items = (payload.get("data") or {}).get("items") or []
        if not isinstance(items, list):
            continue
        
        for it in items:
            if not isinstance(it, dict):
                continue
            try:
                mid = int(it.get("id"))
            except (TypeError, ValueError):
                continue
            if mid in seen_id:
                continue
            seen_id.add(mid)
            cards.append(it)
            if len(cards) >= 5:
                break
        if len(cards) >= 5:
            break
    
    if not cards:
        return {
            "reply": """我先给你一些通用建议：
- 如果有过敏史、孕哺期、儿童、慢病用药或症状较重，请优先咨询医生/药师。
- 用药前请核对说明书：适应症/禁忌/用法用量，避免重复成分叠加。
- 若高热不退、呼吸困难、胸痛、意识异常等，请及时就医。

目前暂时没匹配到可推荐的具体商品，你可以换个关键词（药品名/症状）或补充：体温、是否咳嗽咳痰、症状持续时间、过敏史、是否孕哺、正在使用的药物。""",
            "cards": [],
        }
    
    reply = """我先给你一些通用建议：
- 如果有过敏史、孕哺期、儿童、慢病用药或症状较重，请优先咨询医生/药师。
- 用药前请核对说明书：适应症/禁忌/用法用量，避免重复成分叠加。
- 若高热不退、呼吸困难、胸痛、意识异常等，请及时就医。

为你匹配到以下可能相关的药品（点击可查看详情）："""
    
    return {"reply": reply, "cards": cards}
