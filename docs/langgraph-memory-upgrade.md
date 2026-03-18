# 🧠 LangGraph Memory 升级 - 开发文档

---

## 一、概述

### 1.1 目标

为 LangGraph 对话系统增加智能记忆能力，让 AI 能够：
- 记住用户偏好（付款方式、常购药品等）
- 跨会话识别用户身份
- 长对话自动摘要压缩

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Memory System                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │  User       │    │  Conversation│   │  Summary    │    │
│  │  Profile    │    │  History     │   │  Memory     │    │
│  │  (画像)     │    │  (对话历史)   │   │  (摘要)     │    │
│  └──────┬──────┘    └──────┬───────┘    └──────┬──────┘   │
│         │                  │                    │           │
│         ▼                  ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Memory Manager (memory.py)                │    │
│  │  - save_profile() / load_profile()                  │    │
│  │  - summarize() / load_summary()                     │    │
│  │  - retrieve()                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
              ┌───────────────────────────────┐
              │      LangGraph Nodes          │
              │  - profile_node (画像提取)    │
              │  - summary_node (摘要生成)    │
              │  - context_node (上下文构建)  │
              └───────────────────────────────┘
```

---

## 二、数据结构设计

### 2.1 用户画像 (User Profile)

**Redis Key**: `user:profile:{user_id}`

```json
{
  "user_id": "user_123",
  "extracted_at": "2024-01-15T10:30:00",
  "preferences": {
    "payment_method": "花呗",
    "medicine_types": ["感冒药", "维C"],
    "shipping_address": "北京市朝阳区",
    "contact_preference": "电话"
  },
  "attributes": {
    "is_vip": false,
    "order_count": 5,
    "total_spent": 1200.00,
    "user_type": "老用户"
  },
  "conversation_style": "简洁",
  "last_updated": "2024-01-15T10:30:00"
}
```

**TTL**: 90 天

---

### 2.2 对话摘要 (Conversation Summary)

**Redis Key**: `chat:summary:{conversation_id}`

```json
{
  "conversation_id": "conv_abc123",
  "user_id": "user_123",
  "summary": "用户查询了订单123的物流信息，退款了订单456，咨询了感冒用药推荐",
  "topics": ["订单查询", "退款", "用药咨询"],
  "entities": {
    "order_nos": ["123", "456"],
    "medicines": ["感冒灵", "维C银翘片"]
  },
  "message_count": 12,
  "created_at": "2024-01-15T10:30:00",
  "last_updated": "2024-01-15T10:45:00"
}
```

**TTL**: 7 天

---

### 2.3 用户历史摘要列表

**Redis Key**: `user:summaries:{user_id}`

- 类型: Redis List
- 存储: 最近 10 个会话摘要（最新的在前面）
- TTL: 90 天

---

## 三、Phase 1: 用户画像 - 详细实现

### 3.1 扩展 memory.py

**文件**: `agent/memory.py`

**新增函数**:

```python
# ============ 用户画像 ============

PROFILE_KEY_PREFIX = "user:profile:"
PROFILE_TTL = 90 * 24 * 60 * 60  # 90天


def build_profile_key(user_id: str) -> str:
    """构建用户画像 Key"""
    return f"{PROFILE_KEY_PREFIX}{user_id}"


def save_user_profile(r: redis.Redis, user_id: str, profile: Dict[str, Any], ttl: int = PROFILE_TTL) -> None:
    """保存用户画像"""
    profile["last_updated"] = datetime.now().isoformat()
    r.set(
        build_profile_key(user_id),
        json.dumps(profile, ensure_ascii=False),
        ex=ttl
    )


def load_user_profile(r: redis.Redis, user_id: str) -> Optional[Dict[str, Any]]:
    """加载用户画像"""
    raw = r.get(build_profile_key(user_id))
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def merge_user_profile(r: redis.Redis, user_id: str, new_data: Dict[str, Any]) -> Dict[str, Any]:
    """合并更新用户画像"""
    existing = load_user_profile(r, user_id) or {
        "user_id": user_id,
        "preferences": {},
        "attributes": {},
        "extracted_at": None
    }
    
    # 深度合并
    for key in ["preferences", "attributes"]:
        if key in new_data:
            existing[key] = {**existing.get(key, {}), **new_data[key]}
    
    existing["extracted_at"] = datetime.now().isoformat()
    save_user_profile(r, user_id, existing)
    return existing


# ============ 对话摘要 ============

SUMMARY_KEY_PREFIX = "chat:summary:"
SUMMARY_TTL = 7 * 24 * 60 * 60  # 7天


def build_summary_key(conversation_id: str) -> str:
    return f"{SUMMARY_KEY_PREFIX}{conversation_id}"


def save_conversation_summary(r: redis.Redis, conversation_id: str, summary: Dict[str, Any], ttl: int = SUMMARY_TTL) -> None:
    """保存对话摘要"""
    r.set(
        build_summary_key(conversation_id),
        json.dumps(summary, ensure_ascii=False),
        ex=ttl
    )


def load_conversation_summary(r: redis.Redis, conversation_id: str) -> Optional[Dict[str, Any]]:
    """加载对话摘要"""
    raw = r.get(build_summary_key(conversation_id))
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


# ============ 用户历史摘要列表 ============

USER_SUMMARIES_KEY_PREFIX = "user:summaries:"


def build_user_summaries_key(user_id: str) -> str:
    return f"{USER_SUMMARIES_KEY_PREFIX}{user_id}"


def append_user_summary(r: redis.Redis, user_id: str, summary_text: str, ttl: int = PROFILE_TTL) -> None:
    """追加用户历史摘要"""
    key = build_user_summaries_key(user_id)
    r.lpush(key, summary_text)
    r.ltrim(key, 0, 9)  # 只保留最近10条
    r.expire(key, ttl)


def load_user_summaries(r: redis.Redis, user_id: str, limit: int = 5) -> list:
    """加载用户历史摘要"""
    key = build_user_summaries_key(user_id)
    return r.lrange(key, 0, limit - 1)


# ============ 记忆检索 ============

def retrieve_memory_context(r: redis.Redis, user_id: str, current_query: str) -> Dict[str, Any]:
    """检索记忆构建上下文"""
    
    # 1. 获取用户画像
    profile = load_user_profile(r, user_id)
    
    # 2. 获取历史摘要
    summaries = load_user_summaries(r, user_id, limit=5)
    
    return {
        "user_profile": profile,
        "recent_summaries": summaries,
        "current_query": current_query
    }
```

---

### 3.2 创建画像提取节点

**文件**: `agent/graph/nodes/profile.py`

```python
"""用户画像提取节点."""

from __future__ import annotations
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from agent.graph.states import GraphState
    from agent.settings import Settings


def build_profile_node(llm=None, settings: "Settings" = None):
    """构建画像提取节点工厂"""
    
    def profile_node(state: "GraphState") -> dict[str, Any]:
        """提取/更新用户画像"""
        
        from agent.memory import (
            load_user_profile,
            merge_user_profile,
            load_recent_history,
            get_redis,
        )
        from agent.settings import load_settings
        
        if settings is None:
            settings = load_settings()
        
        user_id = state.get("user_id")
        if not user_id:
            return {}
        
        r = get_redis(settings)
        
        # 加载最近对话历史
        from agent.memory import build_keys
        conversation_id = state.get("conversation_id")
        keys = build_keys(conversation_id)
        recent_messages = load_recent_history(r, keys, limit=20)
        
        if not recent_messages:
            return {}
        
        # 提取用户消息
        user_messages = [
            msg.get("content", "") 
            for msg in recent_messages 
            if msg.get("role") == "user"
        ]
        
        if len(user_messages) < 3:
            # 对话太少，不提取画像
            return {}
        
        # 如果有 LLM，使用 LLM 提取
        if llm:
            profile_data = _extract_profile_with_llm(llm, user_messages)
        else:
            # 简单规则提取（备用方案）
            profile_data = _extract_profile_with_rules(user_messages)
        
        # 合并到现有画像
        updated_profile = merge_user_profile(r, user_id, profile_data)
        
        return {"user_profile": updated_profile}
    
    return profile_node


def _extract_profile_with_llm(llm, user_messages: list[str]) -> dict:
    """使用 LLM 提取用户画像"""
    
    prompt = f"""
从以下用户对话中提取关键信息（JSON格式）：

对话内容：
{chr(10).join(user_messages)}

提取规则：
1. preferences: 用户的偏好
   - payment_method: 付款方式（花呗/微信/银行卡/支付宝）
   - medicine_types: 常购药品类型
   - shipping_address: 收货地址关键词
   - contact_preference: 联系方式偏好

2. attributes: 用户属性
   - user_type: 用户类型（新用户/老用户/会员）
   - order_count_hint: 订单数量暗示（多/少）

只返回有效的 JSON，不要其他内容：
{{
    "preferences": {{}},
    "attributes": {{}}
}}
"""
    
    try:
        result = llm.invoke(prompt)
        # 解析 JSON
        import json
        import re
        match = re.search(r'\{[\s\S]*\}', result)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    
    return {}


def _extract_profile_with_rules(user_messages: list[str]) -> dict:
    """使用规则提取用户画像（无 LLM 备用）"""
    
    all_text = " ".join(user_messages)
    
    preferences = {}
    attributes = {}
    
    # 付款方式
    if "花呗" in all_text:
        preferences["payment_method"] = "花呗"
    elif "微信支付" in all_text:
        preferences["payment_method"] = "微信"
    elif "支付宝" in all_text:
        preferences["payment_method"] = "支付宝"
    
    # 药品类型关键词
    medicine_keywords = ["感冒", "发烧", "咳嗽", "维生素", "维C", "退烧", "消炎", "胃药"]
    found_medicines = [m for m in medicine_keywords if m in all_text]
    if found_medicines:
        preferences["medicine_types"] = found_medicines
    
    # 简单判断新老用户
    if len(user_messages) > 10:
        attributes["user_type"] = "老用户"
    else:
        attributes["user_type"] = "新用户"
    
    return {
        "preferences": preferences,
        "attributes": attributes
    }
```

---

### 3.3 创建上下文构建节点

**文件**: `agent/graph/nodes/context.py`

```python
"""上下文构建节点 - 注入记忆到 LLM 上下文."""

from __future__ import annotations
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from agent.graph.states import GraphState


def build_context_node():
    """构建上下文节点 - 将记忆注入到提示词中"""
    
    def context_node(state: "GraphState") -> dict[str, Any]:
        """构建带记忆的上下文"""
        
        from agent.memory import (
            retrieve_memory_context,
            get_redis,
        )
        from agent.settings import load_settings
        
        settings = load_settings()
        user_id = state.get("user_id")
        current_message = state.get("message", "")
        
        if not user_id:
            return {}
        
        r = get_redis(settings)
        
        # 检索记忆
        memory_context = retrieve_memory_context(r, user_id, current_message)
        
        # 构建上下文提示
        context_parts = []
        
        # 用户画像
        profile = memory_context.get("user_profile")
        if profile:
            prefs = profile.get("preferences", {})
            attrs = profile.get("attributes", {})
            
            if prefs:
                context_parts.append(f"用户偏好：{prefs}")
            if attrs:
                context_parts.append(f"用户属性：{attrs}")
        
        # 历史摘要
        summaries = memory_context.get("recent_summaries", [])
        if summaries:
            context_parts.append(f"历史对话摘要：{'; '.join(summaries)}")
        
        if not context_parts:
            return {}
        
        # 构建增强提示
        memory_context_str = "\n".join(context_parts)
        enhanced_context = f"""
【记忆背景】
{memory_context_str}

【当前问题】
{current_message}

请根据以上背景信息回答用户问题。
"""
        
        return {"memory_context": memory_context_str, "enhanced_context": enhanced_context}
    
    return context_node
```

---

### 3.4 集成到 Graph Builder

**文件**: `agent/graph/builder.py`

```python
"""Graph 构建器."""

from langgraph.graph import END, START, StateGraph

from agent.graph.states import GraphState
from agent.graph.router import route_by_intent
from agent.graph.nodes import (
    normalize_input_node,
    handle_pending_pick_node,
    # ... 其他节点
)

# 新增
from agent.graph.nodes.profile import build_profile_node
from agent.graph.nodes.context import build_context_node


def build_graph(settings=None) -> StateGraph:
    """构建用户端 Graph."""
    
    workflow = StateGraph(GraphState)
    
    # ============ 画像节点（可选，是否启用取决于是否配置 LLM）===========
    profile_node = build_profile_node()
    context_node = build_context_node()
    
    # 添加所有节点
    workflow.add_node("normalize_input", normalize_input_node)
    workflow.add_node("handle_pending", handle_pending_pick_node)
    workflow.add_node("extract_profile", profile_node)  # 新增
    workflow.add_node("inject_context", context_node)   # 新增
    # ... 其他业务节点
    
    # ============ 流程调整 ============
    # 入口 -> normalize -> profile -> handle_pending -> 业务节点
    workflow.add_edge(START, "normalize_input")
    workflow.add_edge("normalize_input", "extract_profile")
    workflow.add_edge("extract_profile", "handle_pending")
    
    # 条件路由
    workflow.add_conditional_edges(
        "handle_pending",
        route_by_intent,
        {
            "ORDER": "order_flow",
            "REFUND": "refund_flow",
            "SHIPPING": "shipping_flow",
            "MEDICAL": "medical_flow",
            "MEDICINE": "medicine_flow",
            "PURCHASE": "purchase_flow",
            "OTHER": "other_flow",
        }
    )
    
    # 业务节点 -> inject_context -> END
    workflow.add_edge("order_flow", "inject_context")
    workflow.add_edge("refund_flow", "inject_context")
    workflow.add_edge("shipping_flow", "inject_context")
    workflow.add_edge("medical_flow", "inject_context")
    workflow.add_edge("medicine_flow", "inject_context")
    workflow.add_edge("purchase_flow", "inject_context")
    workflow.add_edge("other_flow", "inject_context")
    
    workflow.add_edge("inject_context", END)
    
    return workflow.compile()
```

---

## 四、Phase 2: 对话摘要 - 详细实现

### 4.1 创建摘要生成节点

**文件**: `agent/graph/nodes/summary.py`

```python
"""对话摘要节点."""

from __future__ import annotations
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from agent.graph.states import GraphState


SUMMARY_THRESHOLD = 10  # 多少轮对话后触发摘要


def build_summary_node(llm=None, threshold: int = SUMMARY_THRESHOLD):
    """构建摘要节点工厂"""
    
    def summary_node(state: "GraphState") -> dict[str, Any]:
        """生成对话摘要"""
        
        from agent.memory import (
            save_conversation_summary,
            append_user_summary,
            load_recent_history,
            build_keys,
            get_redis,
        )
        from agent.settings import load_settings
        
        settings = load_settings()
        
        conversation_id = state.get("conversation_id")
        user_id = state.get("user_id")
        
        if not conversation_id or not user_id:
            return {}
        
        r = get_redis(settings)
        keys = build_keys(conversation_id)
        
        # 获取对话历史
        messages = load_recent_history(r, keys, limit=50)
        
        if len(messages) < threshold:
            # 对话轮数不够，不生成摘要
            return {}
        
        # 生成摘要
        if llm:
            summary = _generate_summary_with_llm(llm, messages)
        else:
            summary = _generate_summary_with_rules(messages)
        
        if summary:
            # 保存会话摘要
            save_conversation_summary(r, conversation_id, summary)
            
            # 追加到用户历史摘要
            append_user_summary(r, user_id, summary.get("summary_text", ""))
        
        return {"summary_generated": True}
    
    return summary_node


def _generate_summary_with_llm(llm, messages: list) -> dict:
    """使用 LLM 生成摘要"""
    
    # 格式化对话
    conversation_text = "\n".join([
        f"{msg.get('role', 'user')}: {msg.get('content', '')}"
        for msg in messages
    ])
    
    prompt = f"""
请分析以下对话，生成结构化摘要：

{conversation_text}

输出格式（JSON）：
{{
    "summary_text": "一句话概括用户做了什么、问了什么",
    "topics": ["涉及的主题1", "主题2"],
    "entities": {{
        "order_nos": ["订单号列表"],
        "medicines": ["涉及的药品"]
    }},
    "message_count": 总消息数
}}
"""
    
    try:
        import json
        import re
        result = llm.invoke(prompt)
        match = re.search(r'\{[\s\S]*\}', result)
        if match:
            summary = json.loads(match.group())
            return summary
    except Exception:
        pass
    
    return {}


def _generate_summary_with_rules(messages: list) -> dict:
    """使用规则生成摘要（无 LLM 备用）"""
    
    all_text = " ".join([
        msg.get("content", "") 
        for msg in messages 
        if msg.get("role") in ["user", "assistant"]
    ])
    
    topics = []
    entities = {"order_nos": [], "medicines": []}
    
    # 检测主题
    if "订单" in all_text:
        topics.append("订单查询")
    if "退款" in all_text:
        topics.append("退款")
    if "物流" in all_text or "配送" in all_text:
        topics.append("物流")
    if "药" in all_text:
        topics.append("用药咨询")
    
    # 提取订单号
    import re
    order_nos = re.findall(r'\d{18,}', all_text)
    entities["order_nos"] = list(set(order_nos))[:3]
    
    return {
        "summary_text": f"对话涉及：{', '.join(topics) if topics else '一般对话'}",
        "topics": topics,
        "entities": entities,
        "message_count": len(messages)
    }
```

---

## 五、LLM 集成配置

### 5.1 安装依赖

```bash
pip install openai
# 或
pip install anthropic
```

### 5.2 LLM 客户端初始化

**文件**: `agent/llm_client.py`（新建）

```python
"""LLM 客户端封装."""

from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic


class LLMClient:
    def __init__(self, provider: str = "openai", model: str = "gpt-4o", **kwargs):
        self.provider = provider
        self.model = model
        
        if provider == "openai":
            self.client = ChatOpenAI(
                model=model,
                api_key=kwargs.get("api_key"),
                base_url=kwargs.get("base_url"),  # 可配置代理
                temperature=0.7,
            )
        elif provider == "anthropic":
            self.client = ChatAnthropic(
                model=model,
                api_key=kwargs.get("api_key"),
                temperature=0.7,
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    def invoke(self, prompt: str) -> str:
        """调用 LLM"""
        return self.client.invoke(prompt).content


# 全局单例
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> Optional[LLMClient]:
    """获取 LLM 客户端"""
    global _llm_client
    return _llm_client


def init_llm_client(provider: str = "openai", model: str = "gpt-4o", **kwargs):
    """初始化 LLM 客户端"""
    global _llm_client
    _llm_client = LLMClient(provider=provider, model=model, **kwargs)
```

### 5.3 在 app.py 中初始化

```python
from agent.llm_client import init_llm_client
from agent.settings import load_settings

@app.on_event("startup")
async def startup_event():
    settings = load_settings()
    
    # 初始化 LLM（可选）
    if settings.llm_api_key:
        init_llm_client(
            provider=settings.llm_provider or "openai",
            model=settings.llm_model or "gpt-4o",
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
        )
```

### 5.4 Settings 扩展

**文件**: `agent/settings.py`

```python
class Settings(BaseSettings):
    # ... 现有配置 ...
    
    # LLM 配置（新增）
    llm_provider: str = "openai"
    llm_model: str = "gpt-4o"
    llm_api_key: str = ""
    llm_base_url: str = ""  # 可用于代理
```

---

## 六、测试用例

### 6.1 单元测试

```python
# tests/test_memory.py

import pytest
from agent.memory import (
    save_user_profile,
    load_user_profile,
    merge_user_profile,
    build_profile_key,
)


def test_profile_save_and_load(redis_client):
    user_id = "test_user_001"
    profile = {
        "preferences": {"payment_method": "花呗"},
        "attributes": {"order_count": 5}
    }
    
    save_user_profile(redis_client, user_id, profile)
    loaded = load_user_profile(redis_client, user_id)
    
    assert loaded is not None
    assert loaded["preferences"]["payment_method"] == "花呗"


def test_profile_merge(redis_client):
    user_id = "test_user_002"
    
    # 第一次保存
    save_user_profile(redis_client, user_id, {
        "preferences": {"payment_method": "花呗"}
    })
    
    # 合并更新
    merge_user_profile(redis_client, user_id, {
        "preferences": {"medicine_types": ["感冒药"]}
    })
    
    loaded = load_user_profile(redis_client, user_id)
    
    assert loaded["preferences"]["payment_method"] == "花呗"
    assert loaded["preferences"]["medicine_types"] == ["感冒药"]
```

### 6.2 集成测试

```python
# tests/test_profile_node.py

from agent.graph.nodes.profile import build_profile_node


def test_profile_node_with_messages():
    node = build_profile_node()
    
    state = {
        "user_id": "test_user",
        "conversation_id": "test_conv",
        "message": "我想买感冒药"
    }
    
    result = node(state)
    
    # 验证返回
    assert "user_profile" in result or result == {}
```

---

## 七、配置项汇总

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `llm_provider` | `openai` | LLM 提供商 |
| `llm_model` | `gpt-4o` | 模型名称 |
| `llm_api_key` | `` | API Key |
| `llm_base_url` | `` | 代理地址 |
| `profile_ttl` | 90天 | 画像过期时间 |
| `summary_ttl` | 7天 | 摘要过期时间 |
| `summary_threshold` | 10 | 触发摘要的对话轮数 |

---

## 八、实施检查清单

- [ ] 扩展 `memory.py` - 添加画像/摘要/检索函数
- [ ] 创建 `profile.py` - 画像提取节点
- [ ] 创建 `context.py` - 上下文构建节点
- [ ] 创建 `summary.py` - 摘要生成节点
- [ ] 集成到 `builder.py` - 添加新节点
- [ ] 配置 LLM（可选）
- [ ] 编写单元测试
- [ ] 编写集成测试
