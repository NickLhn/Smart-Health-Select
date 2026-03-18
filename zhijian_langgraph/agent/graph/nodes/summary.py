from __future__ import annotations

import re
from typing import Any

from agent.graph.states import GraphState
from agent.memory import (
    build_keys,
    get_redis,
    load_recent_history,
    load_settings,
    save_conversation_summary,
    append_user_summary,
)


ORDER_NO_PATTERN = re.compile(r"\d{10,}")
MEDICINE_KEYWORDS = ["感冒", "发烧", "咳嗽", "消炎", "维生素", "钙片", "胃药", "头痛", "退烧", "感冒灵", "布洛芬"]


def extract_entities(message: str) -> dict[str, list]:
    entities = {"order_nos": [], "medicines": []}
    
    order_nos = ORDER_NO_PATTERN.findall(message)
    entities["order_nos"] = list(set(order_nos))[:3]
    
    for keyword in MEDICINE_KEYWORDS:
        if keyword in message:
            entities["medicines"].append(keyword)
    
    return entities


def extract_topics(messages: list[dict]) -> list[str]:
    topics = set()
    all_text = " ".join(msg.get("content", "") or "" for msg in messages)
    
    if any(k in all_text for k in ["订单", "查单", "物流"]):
        topics.add("订单查询")
    if any(k in all_text for k in ["退款", "退货"]):
        topics.add("退款")
    if any(k in all_text for k in ["发货", "物流", "快递"]):
        topics.add("物流")
    if any(k in all_text for k in MEDICINE_KEYWORDS):
        topics.add("用药咨询")
    if any(k in all_text for k in ["购买", "买", "下单"]):
        topics.add("购买")
    if any(k in all_text for k in ["问", "咨询", "症状"]):
        topics.add("问诊")
    
    return list(topics)[:5]


def generate_summary(messages: list[dict], topics: list[str], entities: dict) -> str:
    if not messages:
        return "用户发起对话"
    
    user_messages = [m.get("content", "") for m in messages if m.get("role") == "user"]
    if not user_messages:
        return f"对话涉及: {', '.join(topics)}" if topics else "对话"
    
    last_message = user_messages[-1][:50]
    
    parts = []
    if topics:
        parts.append(f"讨论了{', '.join(topics[:2])}")
    if entities.get("order_nos"):
        parts.append(f"涉及订单{', '.join(entities['order_nos'][:2])}")
    if entities.get("medicines"):
        parts.append(f"提到药品{', '.join(entities['medicines'][:2])}")
    
    if parts:
        return f"用户{', '.join(parts)}"
    return f"用户咨询: {last_message}..."


def summary_node(state: GraphState) -> dict[str, Any]:
    conversation_id = state.get("conversation_id")
    user_id = state.get("user_id") or state.get("token")
    
    if not conversation_id or not user_id:
        return {}
    
    settings = load_settings()
    r = get_redis(settings)
    keys = build_keys(conversation_id)
    
    history = load_recent_history(r, keys, limit=20)
    
    if len(history) < 3:
        return {}
    
    all_messages = []
    for msg in history:
        if msg.get("content"):
            all_messages.append(msg)
    
    if len(all_messages) < 3:
        return {}
    
    entities = {"order_nos": [], "medicines": []}
    for msg in all_messages:
        content = msg.get("content", "")
        extracted = extract_entities(content)
        entities["order_nos"].extend(extracted["order_nos"])
        entities["medicines"].extend(extracted["medicines"])
    
    entities["order_nos"] = list(set(entities["order_nos"]))[:5]
    entities["medicines"] = list(set(entities["medicines"]))[:5]
    
    topics = extract_topics(all_messages)
    summary_text = generate_summary(all_messages, topics, entities)
    
    summary_data = {
        "conversation_id": conversation_id,
        "user_id": user_id,
        "summary": summary_text,
        "topics": topics,
        "entities": entities,
        "message_count": len(all_messages),
    }
    
    save_conversation_summary(r, conversation_id, summary_data)
    append_user_summary(r, user_id, summary_text)
    
    return {"conversation_summary": summary_data}
