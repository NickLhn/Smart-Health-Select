from __future__ import annotations

from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from agent.auth import AuthUser, authenticate_user
from agent.admin_graph import build_admin_graph
from agent.graph import build_graph
from agent.merchant_graph import build_merchant_graph
from agent.memory import (
    append_history,
    build_keys,
    get_redis,
    load_state,
    save_state,
)
from agent.settings import Settings, load_settings

app = FastAPI(title="zhijian-langgraph-agent", version="0.1.0")


# AI Agent 对外的聊天请求体。
class ChatRequest(BaseModel):
    conversationId: str = Field(..., min_length=6, max_length=128)
    message: str = Field(..., min_length=1, max_length=2000)


def get_settings() -> Settings:
    # 配置加载后缓存在 app.state 中，避免每次请求重复读取环境变量。
    settings = getattr(app.state, "settings", None)
    if settings is None:
        settings = load_settings()
        app.state.settings = settings
    return settings


def get_graph(settings: Settings):
    # 普通用户图只初始化一次，后续请求直接复用。
    graph = getattr(app.state, "graph", None)
    if graph is None:
        graph = build_graph(settings)
        app.state.graph = graph
    return graph


def get_merchant_graph(settings: Settings):
    # 商家图和普通用户图拆开缓存，便于各自维护节点能力。
    graph = getattr(app.state, "merchant_graph", None)
    if graph is None:
        graph = build_merchant_graph(settings)
        app.state.merchant_graph = graph
    return graph


def get_admin_graph(settings: Settings):
    # 管理端图负责审核、运营等后台类问答。
    graph = getattr(app.state, "admin_graph", None)
    if graph is None:
        graph = build_admin_graph(settings)
        app.state.admin_graph = graph
    return graph


def current_user(
    authorization: Optional[str] = Header(default=None),
    request_id: Optional[str] = Header(default=None, alias="X-Request-ID"),
    settings: Settings = Depends(get_settings),
) -> tuple[AuthUser, str, Optional[str]]:
    # Agent 直接依赖后端签发的 Bearer Token 识别当前用户身份。
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    user = authenticate_user(settings, authorization)
    token = authorization.split(" ", 1)[-1].strip()
    return user, token, request_id


def ok(data):
    return {"success": True, "data": data}


@app.get("/health")
def health():
    return ok({"status": "ok"})


@app.post("/chat")
def chat(
    req: ChatRequest,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str, Optional[str]] = Depends(current_user),
):
    user, token, request_id = user_and_token
    r = get_redis(settings)
    keys = build_keys(req.conversationId)

    ttl_seconds = 24 * 60 * 60

    # 先恢复对话状态，再把本轮消息塞回图执行所需上下文。
    state = load_state(r, keys)
    state.update(
        {
            "user_id": user.user_id,
            "conversation_id": req.conversationId,
            "message": req.message,
            "token": token,
            "request_id": request_id,
        }
    )

    append_history(
        r,
        keys,
        {"role": "user", "userId": user.user_id, "content": req.message},
        ttl_seconds,
    )

    # 按用户角色或会话前缀选择对应的业务图。
    graph = get_graph(settings)
    merchant_graph = get_merchant_graph(settings)
    admin_graph = get_admin_graph(settings)
    if user.role == "ADMIN" or req.conversationId.startswith("admin:"):
        selected_graph = admin_graph
    elif user.role == "SELLER" or req.conversationId.startswith("merchant:"):
        selected_graph = merchant_graph
    else:
        selected_graph = graph
    result = selected_graph.invoke(state)

    reply = (result or {}).get("reply") or ""
    cards = (result or {}).get("cards") or []
    action = (result or {}).get("action")

    append_history(
        r,
        keys,
        {"role": "assistant", "userId": user.user_id, "content": reply, "cards": cards},
        ttl_seconds,
    )

    # 只持久化下一轮对话还会用到的关键状态，避免 Redis 中堆积无效上下文。
    persisted_state = {
        "pending_action": (result or {}).get("pending_action"),
        "pending_intent": (result or {}).get("pending_intent"),
        "candidates": (result or {}).get("candidates") or [],
        "intent": (result or {}).get("intent"),
        "cards": cards,
        "purchase_draft": (result or {}).get("purchase_draft"),
        "admin_user_status_draft": (result or {}).get("admin_user_status_draft"),
        "admin_merchant_audit_draft": (result or {}).get("admin_merchant_audit_draft"),
        "admin_merchant_last_id": (result or {}).get("admin_merchant_last_id"),
        "admin_medicine_last_id": (result or {}).get("admin_medicine_last_id"),
        "admin_medicine_status_draft": (result or {}).get("admin_medicine_status_draft"),
        "admin_medicine_delete_draft": (result or {}).get("admin_medicine_delete_draft"),
        "admin_order_last_id": (result or {}).get("admin_order_last_id"),
        "admin_aftersales_last_id": (result or {}).get("admin_aftersales_last_id"),
        "admin_aftersales_audit_draft": (result or {}).get("admin_aftersales_audit_draft"),
        "medicine_draft": (result or {}).get("medicine_draft"),
        "last_medicine_id": (result or {}).get("last_medicine_id"),
        "action": action,
    }
    save_state(r, keys, persisted_state, ttl_seconds)

    return ok(
        {
            "conversationId": req.conversationId,
            "reply": reply,
            "state": persisted_state,
        }
    )
