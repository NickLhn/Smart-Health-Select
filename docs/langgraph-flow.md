# LangGraph 完整流程文档

---

## 一、整体流程图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              LangGraph 用户端对话流程                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                        START
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │   normalize_input    │
                              │     (输入归一化)      │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │    handle_pending     │
                              │    (处理待处理动作)    │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │        profile        │
                              │     (用户画像提取)     │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │        context        │
                              │    (上下文构建)        │
                              └───────────┬───────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │   条件路由 (intent)    │
                              │   (根据意图分发)       │
                              └───────────┬───────────┘
                                          │
              ┌─────────────┬─────────────┼─────────────┬─────────────┐
              │             │             │             │             │
              ▼             ▼             ▼             ▼             ▼
     ┌────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐
     │order_flow  │ │refund_flow │ │shipping_ │ │medical_  │ │medicine_ │
     │ (订单流程) │ │ (退款流程) │ │  flow    │ │ flow     │ │  flow    │
     └─────┬──────┘ └─────┬──────┘ │ (物流流程) │ │ (问诊流程) │ │ (药品流程) │
           │             │        └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
           │             │              │             │             │
           └─────────────┴──────────────┴─────────────┴─────────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │        summary        │
                              │     (对话摘要生成)     │
                              └───────────┬───────────┘
                                          │
                                          ▼
                                         END
```

---

## 二、节点详解

### 2.1 normalize_input (输入归一化)

**功能**: 归一化用户输入，提取关键信息

**处理内容**:
- 识别意图
- 提取订单号
- 处理待处理动作（如购买确认流程）

**代码位置**: `agent/graph/nodes/normalize.py`

---

### 2.2 handle_pending (处理待处理动作)

**功能**: 处理需要用户二次确认的操作

**处理场景**:
- `ORDER_PICK`: 用户需要从订单列表中选择
- `REFUND_PICK`: 用户需要从退款列表中选择
- `SHIPPING_PICK`: 用户需要从物流列表中选择

---

### 2.3 profile (用户画像提取)

**功能**: 从对话中提取并保存用户偏好

**提取规则**:

| 偏好类型 | 关键词 |
|----------|--------|
| payment_method | 花呗、微信、支付宝、银行卡、货到付款 |
| shipping_address | 地址、送到、发货到 |
| contact_preference | 电话、短信、微信 |
| medicine_types | 感冒、发烧、咳嗽、消炎、维生素、钙片、胃药 |

**Redis Key**: `user:profile:{user_id}`

**TTL**: 90天

**代码位置**: `agent/graph/nodes/profile.py`

---

### 2.4 context (上下文构建)

**功能**: 加载用户画像，构建对话上下文

**输出**:
```json
{
  "user_profile": {
    "user_id": "user_123",
    "preferences": {
      "payment_method": "花呗",
      "shipping_address": "北京市朝阳区"
    },
    "attributes": {
      "message_count": 10
    }
  }
}
```

**代码位置**: `agent/graph/nodes/context.py`

---

### 2.5 条件路由 (Intent Classification)

**功能**: 根据意图分类结果，将请求路由到对应业务节点

**意图类型与节点映射**:

| 意图 (Intent) | 节点 (Node) | 说明 |
|---------------|-------------|------|
| ORDER | order_flow | 订单流程 |
| REFUND | refund_flow | 退款流程 |
| SHIPPING | shipping_flow | 物流流程 |
| MEDICAL | medical_flow | 问诊流程 |
| MEDICINE | medicine_flow | 药品流程 |
| PURCHASE | purchase_flow | 购买流程 |
| OTHER | other_flow | 其他 |

**代码位置**: `agent/graph/router.py`

---

### 2.6 业务节点

#### order_flow (订单流程)
- 查询订单列表
- 查询订单详情
- 取消订单

#### refund_flow (退款流程)
- 查询退款列表
- 申请退款
- 查看退款状态

#### shipping_flow (物流流程)
- 查询物流信息
- 查看快递进度

#### medical_flow (问诊流程)
- 伤口处理指导
- 常见疾病咨询
- 用药建议

#### medicine_flow (药品流程)
- 搜索药品
- 药品详情查询
- 药品推荐

#### purchase_flow (购买流程)
- 加入购物车
- 确认订单
- 发起支付

#### other_flow (其他)
- 通用问答
- 转人工服务

---

### 2.7 summary (对话摘要生成)

**功能**: 对话结束后生成摘要，保存到Redis

**触发条件**: 消息数量 ≥ 3 条

**提取内容**:
- 订单号 (正则匹配)
- 药品关键词
- 话题分类 (订单查询、退款、物流、用药咨询、购买、问诊)

**存储位置**:

| Key | 说明 | TTL |
|-----|------|-----|
| `chat:summary:{conversation_id}` | 当前会话摘要 | 7天 |
| `user:summaries:{user_id}` | 用户历史摘要列表 (保留10条) | 90天 |

**代码位置**: `agent/graph/nodes/summary.py`

---

## 三、状态 (State) 定义

```python
class GraphState(TypedDict, total=False):
    message: str                      # 用户消息
    token: str                        # 用户认证 token
    user_id: str                      # 用户ID
    request_id: str                   # 请求追踪ID
    intent: Intent                    # 识别出的意图
    pending_action: str               # 待处理动作
    candidates: list                  # 候选列表
    order_no: str                     # 订单号
    purchase_draft: dict              # 购买草稿
    last_medicine_id: int             # 最后操作的药品ID
    reply: str                        # 回复内容
    cards: list                       # 卡片数据
    action: dict                      # 前端动作
    history: list                     # 对话历史
    user_profile: dict                # 用户画像
    conversation_summary: dict        # 对话摘要
```

---

## 四、Redis Key 汇总

| Key 模式 | 说明 | TTL |
|----------|------|-----|
| `chat:history:{conversation_id}` | 对话历史 | 24小时 |
| `chat:state:{conversation_id}` | 对话状态 | 24小时 |
| `user:profile:{user_id}` | 用户画像 | 90天 |
| `chat:summary:{conversation_id}` | 会话摘要 | 7天 |
| `user:summaries:{user_id}` | 用户历史摘要 | 90天 |

---

## 五、部署后验证

1. **启动服务**: `python -m uvicorn agent.app:app --host 127.0.0.1 --port 18081`

2. **测试用户画像**:
   - 发送消息: "我想用花呗付款"
   - 检查Redis: `GET user:profile:{user_id}`

3. **测试对话摘要**:
   - 连续发送3条以上消息
   - 检查Redis: `GET chat:summary:{conversation_id}`
