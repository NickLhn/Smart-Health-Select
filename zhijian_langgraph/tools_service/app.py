from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional
import logging
import httpx
from fastapi import Body, Depends, FastAPI, Header, HTTPException, Query
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

from tools_service.auth import AuthUser, authenticate_user
from tools_service.db import get_conn
from tools_service.formatters import mask_credit_code, mask_phone
from tools_service.repository import (
    format_medicine_cards,
    format_order_detail,
    format_recent_orders,
    format_recent_refunds,
    format_recent_shipping,
    format_refund_status,
    format_shipping_status,
    get_delivery_row_by_order_id,
    get_merchant_product_search_rows,
    get_merchant_dashboard_summary,
    get_merchant_diagnosis_overview,
    get_merchant_inventory_low,
    get_merchant_inventory_forecast,
    get_merchant_order_row_by_no,
    get_merchant_orders_list,
    get_merchant_pending_summary,
    get_merchant_refunds_list,
    get_merchant_refunds_summary,
    get_merchant_sales_trend,
    get_merchant_top_products,
    get_medicine_search_rows,
    get_order_items_rows,
    get_order_row_by_no,
    get_recent_orders_rows,
    get_recent_refund_apply_rows,
    get_recent_shipping_rows,
    get_refund_apply_by_order_id,
    get_refund_payment_rows,
)
from tools_service.settings import Settings, load_settings

app = FastAPI(title="tools-service", version="0.1.0")


def get_settings() -> Settings:
    # 配置对象只在首次请求时加载，后续直接复用缓存。
    settings = getattr(app.state, "settings", None)
    if settings is None:
        settings = load_settings()
        app.state.settings = settings
    return settings


@app.on_event("startup")
def ensure_medicine_deleted_column():
    # 启动时兜底补齐 deleted 字段，兼容旧库结构。
    settings = get_settings()
    try:
        with get_conn(settings) as conn:
            with conn.cursor() as cur:
                cur.execute("SHOW COLUMNS FROM pms_medicine LIKE 'deleted'")
                row = cur.fetchone()
                if not row:
                    cur.execute(
                        "ALTER TABLE pms_medicine ADD COLUMN deleted tinyint(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除'"
                    )
                    conn.commit()
    except Exception:
        return


def ok(data):
    return {"success": True, "data": data}


def current_user(
    authorization: Optional[str] = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> AuthUser:
    # 所有工具接口都复用后端 JWT 做鉴权。
    return authenticate_user(settings, authorization)

def current_user_and_token(
    authorization: Optional[str] = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> tuple[AuthUser, str]:
    # 某些接口不仅要识别用户，还要把原始 token 继续透传给后端。
    user = authenticate_user(settings, authorization)
    token = (authorization or "").split(" ", 1)[-1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    return user, token


def current_seller_user(
    authorization: Optional[str] = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> AuthUser:
    # 商家专属工具接口统一在这里做角色校验。
    user = authenticate_user(settings, authorization)
    if user.role != "SELLER":
        raise HTTPException(status_code=403, detail="Seller role required")
    return user


def current_seller_user_and_token(
    authorization: Optional[str] = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> tuple[AuthUser, str]:
    user, token = current_user_and_token(authorization=authorization, settings=settings)
    if user.role != "SELLER":
        raise HTTPException(status_code=403, detail="Seller role required")
    return user, token


def current_admin_user_and_token(
    authorization: Optional[str] = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> tuple[AuthUser, str]:
    # 管理端工具接口需要限制为管理员角色。
    user, token = current_user_and_token(authorization=authorization, settings=settings)
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user, token


def _merchant_missing_fields(merchant: dict) -> list[str]:
    # 统一判断商家入驻资料是否完整，供 AI 和后台工具共用。
    def present(key: str) -> bool:
        v = merchant.get(key)
        if v is None:
            return False
        if isinstance(v, str):
            return bool(v.strip())
        return True

    missing: list[str] = []
    if not present("shopName"):
        missing.append("店铺名称")
    if not present("address"):
        missing.append("店铺地址")
    if not present("licenseUrl"):
        missing.append("营业执照")
    if not present("creditCode"):
        missing.append("统一社会信用代码")
    if not present("contactName"):
        missing.append("联系人姓名")
    if not present("contactPhone"):
        missing.append("联系电话")
    if not present("idCardFront"):
        missing.append("法人身份证正面")
    if not present("idCardBack"):
        missing.append("法人身份证背面")
    return missing


def _sanitize_merchant(merchant: dict, reveal_fields: set[str]) -> dict:
    # 对商家资料做脱敏，避免工具接口把完整敏感信息直接返回给模型或前端。
    def include_full(field: str) -> bool:
        return field in reveal_fields

    license_url = merchant.get("licenseUrl")
    id_front = merchant.get("idCardFront")
    id_back = merchant.get("idCardBack")
    sanitized = {
        "id": merchant.get("id"),
        "userId": merchant.get("userId"),
        "shopName": merchant.get("shopName"),
        "shopLogo": merchant.get("shopLogo"),
        "description": merchant.get("description"),
        "address": merchant.get("address"),
        "contactName": merchant.get("contactName"),
        "contactPhone": merchant.get("contactPhone") if include_full("contactPhone") else mask_phone(merchant.get("contactPhone")),
        "creditCode": merchant.get("creditCode") if include_full("creditCode") else mask_credit_code(merchant.get("creditCode")),
        "auditStatus": merchant.get("auditStatus"),
        "auditRemark": merchant.get("auditRemark"),
        "createTime": merchant.get("createTime"),
        "updateTime": merchant.get("updateTime"),
        "materials": {
            "license": {"present": bool(str(license_url or "").strip()), "url": license_url},
            "idCardFront": {"present": bool(str(id_front or "").strip()), "url": id_front},
            "idCardBack": {"present": bool(str(id_back or "").strip()), "url": id_back},
        },
    }
    sanitized["missingMaterials"] = _merchant_missing_fields(merchant)
    sanitized["materialsComplete"] = len(sanitized["missingMaterials"]) == 0
    return sanitized


def _resolve_time_range(
    time_range: str,
    start: Optional[str],
    end: Optional[str],
) -> tuple[datetime, datetime, str]:
    # 把自然语言侧的时间范围概念收敛成明确的起止时间。
    tr = (time_range or "").strip() or "today"
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day)

    if tr == "today":
        return today_start, now, "today"
    if tr == "yesterday":
        y = today_start - timedelta(days=1)
        return y, today_start - timedelta(seconds=1), "yesterday"
    if tr == "last7":
        s = today_start - timedelta(days=6)
        return s, now, "last7"
    if tr == "last30":
        s = today_start - timedelta(days=29)
        return s, now, "last30"
    if tr == "custom":
        if not start or not end:
            raise HTTPException(status_code=400, detail="Missing start/end for custom timeRange")
        try:
            s = datetime.fromisoformat(start.strip())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start format")
        try:
            e = datetime.fromisoformat(end.strip())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end format")
        return s, e, "custom"
    raise HTTPException(status_code=400, detail="Invalid timeRange")

def _backend_url(settings: Settings, path: str) -> str:
    # 后端地址统一通过配置拼接，避免各接口手写 base url。
    base = settings.backend_base_url.rstrip("/")
    p = (path or "").strip()
    if not p.startswith("/"):
        p = "/" + p
    return base + p

def _raise_on_backend_result(payload: dict) -> dict:
    # tools-service 复用后端返回格式，统一在这里把业务错误转换成 HTTP 异常。
    try:
        code = int(payload.get("code"))
    except (TypeError, ValueError):
        logger.error(f"Invalid code in response: {payload}")
        raise HTTPException(status_code=502, detail="Invalid backend response")
    if code == 200:
        return payload
    message = str(payload.get("message") or "Request failed")
    logger.warning(f"Backend returned error: code={code}, message={message}")
    if code == 401:
        raise HTTPException(status_code=401, detail=message)
    raise HTTPException(status_code=400, detail=message)

class CreateFromCartPayload(BaseModel):
    # AI 帮用户下单时使用的购物车下单载荷。
    cartItemIds: list[int] = Field(..., min_length=1)
    addressId: int
    userCouponId: Optional[int] = None
    patientId: Optional[int] = None
    prescriptionImage: Optional[str] = None


class CartAddPayload(BaseModel):
    # AI 帮用户加购时使用的参数模型。
    medicineId: int
    count: int = Field(default=1, ge=1, le=999)


@app.get("/health")
def health():
    return ok({"status": "ok"})


@app.get("/tools/orders/recent")
def tools_orders_recent(
    limit: int = Query(default=5, ge=1, le=10),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_user),
):
    with get_conn(settings) as conn:
        rows = get_recent_orders_rows(conn, user.user_id, limit)
    return ok(format_recent_orders(rows))


@app.get("/tools/orders/{order_no}")
def tools_order_detail(
    order_no: str,
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_user),
):
    with get_conn(settings) as conn:
        order_row = get_order_row_by_no(conn, user.user_id, order_no)
        if not order_row:
            raise HTTPException(status_code=404, detail="Order not found")
        items = get_order_items_rows(conn, int(order_row["id"]))
    return ok(format_order_detail(order_row, items))


@app.get("/tools/refunds/recent")
def tools_refunds_recent(
    limit: int = Query(default=3, ge=1, le=10),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_user),
):
    with get_conn(settings) as conn:
        rows = get_recent_refund_apply_rows(conn, user.user_id, limit)
    return ok(format_recent_refunds(rows))


@app.get("/tools/refunds/status")
def tools_refunds_status(
    orderNo: str = Query(..., min_length=6),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_user),
):
    with get_conn(settings) as conn:
        order_row = get_order_row_by_no(conn, user.user_id, orderNo)
        if not order_row:
            raise HTTPException(status_code=404, detail="Order not found")
        order_id = int(order_row["id"])
        refund_apply = get_refund_apply_by_order_id(conn, user.user_id, order_id)
        if not refund_apply:
            raise HTTPException(status_code=404, detail="Refund apply not found")
        refund_payments = get_refund_payment_rows(conn, user.user_id, order_id)
    return ok(format_refund_status(orderNo, refund_apply, refund_payments))


@app.get("/tools/shipping/recent")
def tools_shipping_recent(
    limit: int = Query(default=5, ge=1, le=10),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_user),
):
    with get_conn(settings) as conn:
        rows = get_recent_shipping_rows(conn, user.user_id, limit)
    return ok(format_recent_shipping(rows))


@app.get("/tools/shipping/status")
def tools_shipping_status(
    orderNo: str = Query(..., min_length=6),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_user),
):
    with get_conn(settings) as conn:
        order_row = get_order_row_by_no(conn, user.user_id, orderNo)
        if not order_row:
            raise HTTPException(status_code=404, detail="Order not found")
        order_id = int(order_row["id"])
        delivery = get_delivery_row_by_order_id(conn, order_id)
        if not delivery:
            raise HTTPException(status_code=404, detail="Delivery not found")
    return ok(format_shipping_status(orderNo, delivery))


@app.get("/tools/medicines/search")
def tools_medicines_search(
    keyword: str = Query(..., min_length=1, max_length=40),
    limit: int = Query(default=5, ge=1, le=10),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_user),
):
    with get_conn(settings) as conn:
        rows = get_medicine_search_rows(conn, keyword, limit)
    return ok(format_medicine_cards(rows))


@app.get("/tools/medicines/list")
def tools_medicines_list(
    keyword: Optional[str] = Query(default=None, max_length=50),
    page: int = Query(default=1, ge=1, le=500),
    size: int = Query(default=10, ge=1, le=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/medicine/list")
    params: dict = {"page": page, "size": size, "status": 1}
    if keyword:
        params["keyword"] = keyword
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    return ok(
        {
            "records": data.get("records") or [],
            "total": data.get("total") or 0,
            "page": page,
            "size": size,
        }
    )


@app.get("/tools/medicines/{medicine_id}")
def tools_medicine_detail(
    medicine_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/{medicine_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    return ok(payload.get("data"))

@app.get("/tools/admin/orders/list")
def tools_admin_orders_list(
    status: Optional[int] = Query(default=None, ge=-1, le=7),
    page: int = Query(default=1, ge=1, le=500),
    size: int = Query(default=10, ge=1, le=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/orders/admin/list")
    params: dict = {"page": page, "size": size}
    if status is not None:
        params["status"] = status
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    return ok(
        {
            "records": data.get("records") or [],
            "total": data.get("total") or 0,
            "page": page,
            "size": size,
        }
    )

@app.get("/tools/admin/orders/{order_id}")
def tools_admin_order_detail(
    order_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/orders/{order_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    return ok(payload.get("data"))


@app.get("/tools/admin/aftersales/list")
def tools_admin_aftersales_list(
    status: Optional[int] = Query(default=None, ge=0, le=2),
    page: int = Query(default=1, ge=1, le=500),
    size: int = Query(default=10, ge=1, le=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/aftersales/list")
    params: dict = {"page": page, "size": size}
    if status is not None:
        params["status"] = status
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    return ok(data)


@app.get("/tools/admin/aftersales/{apply_id}")
def tools_admin_aftersales_detail(
    apply_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/aftersales/list")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params={"page": 1, "size": 200},
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    records = (data.get("records") or []) if isinstance(data, dict) else []
    if isinstance(records, list):
        for r in records:
            if isinstance(r, dict) and str(r.get("id")) == str(apply_id):
                return ok(r)
    raise HTTPException(status_code=404, detail="After-sales apply not found")


@app.post("/tools/admin/aftersales/{apply_id}/audit/preview")
def tools_admin_aftersales_audit_preview(
    apply_id: int,
    pass_: bool = Query(..., alias="pass"),
    auditReason: Optional[str] = Query(default=None, max_length=255),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    if auditReason is not None:
        auditReason = auditReason.strip()[:255] or None
    _, token = user_and_token
    url = _backend_url(settings, "/aftersales/list")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params={"page": 1, "size": 200},
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    records = (data.get("records") or []) if isinstance(data, dict) else []
    picked = None
    if isinstance(records, list):
        for r in records:
            if isinstance(r, dict) and str(r.get("id")) == str(apply_id):
                picked = r
                break
    if not picked:
        raise HTTPException(status_code=404, detail="After-sales apply not found")
    current_status = picked.get("status")
    allowed = True
    reason = None
    if current_status is None or int(current_status) != 0:
        allowed = False
        reason = "Already processed"
    if not pass_ and not auditReason:
        allowed = False
        reason = "Reject requires auditReason"
    return ok(
        {
            "applyId": apply_id,
            "orderId": picked.get("orderId"),
            "orderNo": picked.get("orderNo"),
            "type": picked.get("type"),
            "amount": picked.get("amount"),
            "applyReason": picked.get("reason"),
            "originalOrderStatus": picked.get("originalOrderStatus"),
            "currentStatus": current_status,
            "action": "APPROVE" if pass_ else "REJECT",
            "auditReason": auditReason,
            "allowed": allowed,
            "notAllowedReason": reason,
        }
    )


@app.post("/tools/admin/aftersales/{apply_id}/audit")
def tools_admin_aftersales_audit(
    apply_id: int,
    pass_: bool = Query(..., alias="pass"),
    auditReason: Optional[str] = Query(default=None, max_length=255),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    if auditReason is not None:
        auditReason = auditReason.strip()[:255] or None
    _, token = user_and_token
    url = _backend_url(settings, "/aftersales/audit")
    body: dict = {"id": apply_id, "pass": bool(pass_)}
    if auditReason:
        body["auditReason"] = auditReason
    try:
        resp = httpx.post(
            url,
            headers={"Authorization": f"Bearer {token}"},
            json=body,
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    _raise_on_backend_result(payload)
    return ok({"applyId": apply_id, "pass": bool(pass_), "auditReason": auditReason})


@app.get("/tools/merchant/products/search")
def tools_merchant_products_search(
    keyword: str = Query(..., min_length=1, max_length=40),
    limit: int = Query(default=5, ge=1, le=20),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    with get_conn(settings) as conn:
        rows = get_merchant_product_search_rows(conn, user.user_id, keyword, limit)
    return ok(format_medicine_cards(rows))


@app.get("/tools/merchant/medicines/list")
def tools_merchant_medicines_list(
    keyword: Optional[str] = Query(default=None, max_length=50),
    status: Optional[int] = Query(default=None, ge=0, le=1),
    page: int = Query(default=1, ge=1, le=500),
    size: int = Query(default=10, ge=1, le=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_seller_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/medicine/merchant/list")
    params: dict = {"page": page, "size": size}
    if keyword:
        params["keyword"] = keyword
    if status is not None:
        params["status"] = status
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    return ok(
        {
            "records": data.get("records") or [],
            "total": data.get("total") or 0,
            "page": page,
            "size": size,
        }
    )


@app.get("/tools/merchant/medicines/{medicine_id}")
def tools_merchant_medicine_detail(
    medicine_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_seller_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/{medicine_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    return ok(payload.get("data"))


@app.post("/tools/merchant/medicines/{medicine_id}/status/preview")
def tools_merchant_medicine_status_preview(
    medicine_id: int,
    toStatus: int = Query(..., ge=0, le=1),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_seller_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/{medicine_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    if not isinstance(data, dict) or not data:
        raise HTTPException(status_code=404, detail="Medicine not found")
    current = data.get("status")
    allowed = True
    reason = None
    if current is not None and str(current) == str(toStatus):
        allowed = False
        reason = "No change needed"
    return ok(
        {
            "medicineId": medicine_id,
            "name": data.get("name"),
            "currentStatus": current,
            "toStatus": toStatus,
            "allowed": allowed,
            "reason": reason,
        }
    )


@app.patch("/tools/merchant/medicines/{medicine_id}/status")
def tools_merchant_medicine_set_status(
    medicine_id: int,
    status: int = Query(..., ge=0, le=1),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_seller_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/{medicine_id}/status")
    try:
        resp = httpx.patch(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params={"status": status},
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    _raise_on_backend_result(payload)
    return ok({"medicineId": medicine_id, "status": status})


@app.post("/tools/merchant/medicines/{medicine_id}/delete/preview")
def tools_merchant_medicine_delete_preview(
    medicine_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_seller_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/{medicine_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    if not isinstance(data, dict) or not data:
        raise HTTPException(status_code=404, detail="Medicine not found")
    current = data.get("status")
    allowed = True
    reason = None
    if current is None or int(current) != 0:
        allowed = False
        reason = "Must be off shelf before deletion"
    return ok(
        {
            "medicineId": medicine_id,
            "name": data.get("name"),
            "currentStatus": current,
            "allowed": allowed,
            "reason": reason,
        }
    )


@app.delete("/tools/merchant/medicines/{medicine_id}")
def tools_merchant_medicine_delete(
    medicine_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_seller_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/{medicine_id}")
    try:
        resp = httpx.delete(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    _raise_on_backend_result(payload)
    return ok({"medicineId": medicine_id, "deleted": True})


@app.get("/tools/cart/list")
def tools_cart_list(
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/cart/list")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    return ok({"items": payload.get("data") or []})


@app.post("/tools/cart/add")
def tools_cart_add(
    payload: CartAddPayload = Body(...),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/cart/add")
    try:
        resp = httpx.post(
            url,
            headers={"Authorization": f"Bearer {token}"},
            json=payload.model_dump(),
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        backend_payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    _raise_on_backend_result(backend_payload)
    return ok(True)


@app.get("/tools/user/address/list")
def tools_user_address_list(
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/user/address/list")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    return ok({"items": payload.get("data") or []})


@app.get("/tools/admin/users/list")
def tools_admin_users_list(
    keyword: Optional[str] = Query(default=None, max_length=50),
    status: Optional[int] = Query(default=None, ge=0, le=1),
    page: int = Query(default=1, ge=1, le=500),
    size: int = Query(default=10, ge=1, le=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/user/admin/list")
    params: dict = {"page": page, "size": size, "role": "USER"}
    if keyword:
        params["keyword"] = keyword
    if status is not None:
        params["status"] = status
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    records = data.get("records") or []
    if isinstance(records, list):
        for row in records:
            if isinstance(row, dict):
                row["password"] = None
                if "mobile" in row:
                    row["mobile"] = mask_phone(row.get("mobile"))
    return ok({"records": records, "total": data.get("total") or 0, "page": page, "size": size})


@app.get("/tools/admin/users/{user_id}")
def tools_admin_user_detail(
    user_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/user/admin/{user_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    if isinstance(data, dict):
        data["password"] = None
        if "mobile" in data:
            data["mobile"] = mask_phone(data.get("mobile"))
    return ok(data)


@app.patch("/tools/admin/users/{user_id}/status")
def tools_admin_user_set_status(
    user_id: int,
    status: int = Query(..., ge=0, le=1),
    reason: Optional[str] = Query(default=None, max_length=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token

    detail_url = _backend_url(settings, f"/user/admin/{user_id}")
    try:
        detail_resp = httpx.get(
            detail_url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        detail_payload = detail_resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    detail_payload = _raise_on_backend_result(detail_payload)
    user_data = detail_payload.get("data") or {}
    if not isinstance(user_data, dict):
        raise HTTPException(status_code=502, detail="Invalid backend response")
    if str(user_data.get("role") or "") != "USER":
        raise HTTPException(status_code=400, detail="Only USER role can be updated via this tool")

    url = _backend_url(settings, f"/user/admin/{user_id}/status")
    try:
        resp = httpx.patch(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params={"status": status},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    _raise_on_backend_result(payload)
    return ok({"userId": user_id, "status": status, "reason": reason})


@app.get("/tools/admin/medicines/list")
def tools_admin_medicines_list(
    keyword: Optional[str] = Query(default=None, max_length=50),
    status: Optional[int] = Query(default=None, ge=0, le=1),
    page: int = Query(default=1, ge=1, le=500),
    size: int = Query(default=10, ge=1, le=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/medicine/admin/list")
    params: dict = {"page": page, "size": size}
    if keyword:
        params["keyword"] = keyword
    if status is not None:
        params["status"] = status
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    return ok(
        {
            "records": data.get("records") or [],
            "total": data.get("total") or 0,
            "page": page,
            "size": size,
        }
    )


@app.get("/tools/admin/medicines/{medicine_id}")
def tools_admin_medicine_detail(
    medicine_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/{medicine_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    return ok(payload.get("data"))


@app.post("/tools/admin/medicines/{medicine_id}/status/preview")
def tools_admin_medicine_status_preview(
    medicine_id: int,
    toStatus: int = Query(..., ge=0, le=1),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/{medicine_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    if not isinstance(data, dict) or not data:
        raise HTTPException(status_code=404, detail="Medicine not found")
    current = data.get("status")
    allowed = True
    reason = None
    if current is not None and str(current) == str(toStatus):
        allowed = False
        reason = "No change needed"
    return ok(
        {
            "medicineId": medicine_id,
            "name": data.get("name"),
            "currentStatus": current,
            "toStatus": toStatus,
            "allowed": allowed,
            "reason": reason,
        }
    )


@app.patch("/tools/admin/medicines/{medicine_id}/status")
def tools_admin_medicine_set_status(
    medicine_id: int,
    status: int = Query(..., ge=0, le=1),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/admin/{medicine_id}/status")
    try:
        resp = httpx.patch(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params={"status": status},
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    _raise_on_backend_result(payload)
    return ok({"medicineId": medicine_id, "status": status})


@app.post("/tools/admin/medicines/{medicine_id}/delete/preview")
def tools_admin_medicine_delete_preview(
    medicine_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/{medicine_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    if not isinstance(data, dict) or not data:
        raise HTTPException(status_code=404, detail="Medicine not found")
    current = data.get("status")
    allowed = True
    reason = None
    if current is None or int(current) != 0:
        allowed = False
        reason = "Must be off shelf before deletion"
    return ok(
        {
            "medicineId": medicine_id,
            "name": data.get("name"),
            "currentStatus": current,
            "allowed": allowed,
            "reason": reason,
        }
    )


@app.delete("/tools/admin/medicines/{medicine_id}")
def tools_admin_medicine_delete(
    medicine_id: int,
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, f"/medicine/admin/{medicine_id}")
    try:
        resp = httpx.delete(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    _raise_on_backend_result(payload)
    return ok({"medicineId": medicine_id, "deleted": True})


@app.get("/tools/admin/merchants/list")
def tools_admin_merchants_list(
    keyword: Optional[str] = Query(default=None, max_length=50),
    auditStatus: Optional[int] = Query(default=None, ge=0, le=2),
    page: int = Query(default=1, ge=1, le=500),
    size: int = Query(default=10, ge=1, le=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/merchant/list")
    params: dict = {"page": page, "size": size}
    if keyword:
        params["keyword"] = keyword
    if auditStatus is not None:
        params["auditStatus"] = auditStatus
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    records = data.get("records") or []
    sanitized_records: list[dict] = []
    if isinstance(records, list):
        for row in records:
            if isinstance(row, dict):
                sanitized_records.append(_sanitize_merchant(row, reveal_fields=set()))
    return ok(
        {
            "records": sanitized_records,
            "total": data.get("total") or 0,
            "page": page,
            "size": size,
        }
    )


@app.get("/tools/admin/merchants/{merchant_id}")
def tools_admin_merchant_detail(
    merchant_id: int,
    revealFields: Optional[str] = Query(default=None, max_length=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    reveal_fields: set[str] = set()
    if revealFields:
        for f in revealFields.split(","):
            f = f.strip()
            if f in {"contactPhone", "creditCode", "licenseUrl", "idCardFront", "idCardBack"}:
                reveal_fields.add(f)
    url = _backend_url(settings, f"/merchant/{merchant_id}")
    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    payload = _raise_on_backend_result(payload)
    data = payload.get("data") or {}
    if not isinstance(data, dict) or not data:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return ok(_sanitize_merchant(data, reveal_fields=reveal_fields))


@app.post("/tools/admin/merchants/{merchant_id}/audit/preview")
def tools_admin_merchant_audit_preview(
    merchant_id: int,
    auditStatus: int = Query(..., ge=1, le=2),
    auditRemark: Optional[str] = Query(default=None, max_length=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token
    detail_url = _backend_url(settings, f"/merchant/{merchant_id}")
    try:
        detail_resp = httpx.get(
            detail_url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        detail_payload = detail_resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    detail_payload = _raise_on_backend_result(detail_payload)
    merchant = detail_payload.get("data") or {}
    if not isinstance(merchant, dict) or not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    missing = _merchant_missing_fields(merchant)
    allowed = True
    reason = None
    if auditStatus == 1 and missing:
        allowed = False
        reason = "Missing required materials"
    if auditStatus == 2 and not (auditRemark and str(auditRemark).strip()):
        allowed = False
        reason = "Audit remark required for rejection"
    return ok(
        {
            "merchantId": merchant_id,
            "currentAuditStatus": merchant.get("auditStatus"),
            "toAuditStatus": auditStatus,
            "allowed": allowed,
            "reason": reason,
            "missingMaterials": missing,
        }
    )


@app.put("/tools/admin/merchants/{merchant_id}/audit")
def tools_admin_merchant_audit(
    merchant_id: int,
    auditStatus: int = Query(..., ge=1, le=2),
    auditRemark: Optional[str] = Query(default=None, max_length=200),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_admin_user_and_token),
):
    _, token = user_and_token

    preview_url = _backend_url(settings, f"/merchant/{merchant_id}")
    try:
        detail_resp = httpx.get(
            preview_url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(8.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        detail_payload = detail_resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    detail_payload = _raise_on_backend_result(detail_payload)
    merchant = detail_payload.get("data") or {}
    if not isinstance(merchant, dict) or not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    missing = _merchant_missing_fields(merchant)
    if auditStatus == 1 and missing:
        raise HTTPException(status_code=400, detail="Cannot approve with missing required materials")
    if auditStatus == 2 and not (auditRemark and str(auditRemark).strip()):
        raise HTTPException(status_code=400, detail="Audit remark required for rejection")

    url = _backend_url(settings, "/merchant/audit")
    payload = {"id": merchant_id, "auditStatus": auditStatus, "auditRemark": auditRemark}
    try:
        resp = httpx.put(
            url,
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=httpx.Timeout(10.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        backend_payload = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Invalid backend response")
    _raise_on_backend_result(backend_payload)
    return ok({"merchantId": merchant_id, "auditStatus": auditStatus, "auditRemark": auditRemark, "missingMaterials": missing})


@app.post("/tools/orders/createFromCart")
def tools_orders_create_from_cart(
    payload: CreateFromCartPayload = Body(...),
    settings: Settings = Depends(get_settings),
    user_and_token: tuple[AuthUser, str] = Depends(current_user_and_token),
):
    _, token = user_and_token
    url = _backend_url(settings, "/orders/createFromCart")
    logger.info(f"Creating order from cart with payload: {payload.model_dump(exclude_none=True)}")
    try:
        resp = httpx.post(
            url,
            headers={"Authorization": f"Bearer {token}"},
            json=payload.model_dump(exclude_none=True),
            timeout=httpx.Timeout(12.0, connect=3.0),
            trust_env=False,
        )
    except httpx.RequestError as e:
        logger.error(f"Backend unavailable: {e}")
        raise HTTPException(status_code=502, detail="Backend unavailable")
    try:
        backend_payload = resp.json()
        logger.info(f"Backend response status: {resp.status_code}, body: {backend_payload}")
    except Exception as e:
        logger.error(f"Invalid backend response: {e}")
        raise HTTPException(status_code=502, detail="Invalid backend response")
    
    # Check if backend returned an error
    code = backend_payload.get("code")
    if code != 200:
        err_msg = backend_payload.get("message", "Unknown error")
        logger.error(f"Backend error: code={code}, message={err_msg}")
        # 返回错误信息而不是抛出异常，让上层处理
        return {"success": False, "error": err_msg, "code": code}
    
    data = backend_payload.get("data")
    logger.info(f"Order data from backend: {data}")
    if not isinstance(data, list):
        logger.error(f"Invalid data format (not a list): {data}")
        raise HTTPException(status_code=502, detail="Invalid backend response")
    return ok({"orderIds": data})


@app.get("/tools/merchant/dashboard/summary")
def tools_merchant_dashboard_summary(
    timeRange: str = Query(default="today"),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    s, e, tr = _resolve_time_range(timeRange, start, end)
    with get_conn(settings) as conn:
        summary = get_merchant_dashboard_summary(conn, user.user_id, s, e, low_stock_threshold=7)
    return ok(
        {
            "timeRangeApplied": {"type": tr, "start": s.strftime("%Y-%m-%d %H:%M:%S"), "end": e.strftime("%Y-%m-%d %H:%M:%S"), "timezone": "Asia/Shanghai"},
            "metricBasis": "paid_at",
            **summary,
            "compare": {"enabled": False},
        }
    )


@app.get("/tools/merchant/orders/pending_summary")
def tools_merchant_orders_pending_summary(
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    with get_conn(settings) as conn:
        data = get_merchant_pending_summary(conn, user.user_id)
    return ok(data)


def _order_status_values(status: Optional[str]) -> Optional[list[int]]:
    if not status:
        return None
    mapping = {
        "WAIT_PAY": [0, 10],
        "WAIT_AUDIT": [7],
        "WAIT_SHIP": [1, 20, 30],
        "SHIPPED": [2, 8, 40],
        "FINISHED": [3, 50],
        "CANCELED": [-1, 6, 60],
        "AFTER_SALE": [4],
    }
    key = status.strip().upper()
    if key not in mapping:
        raise HTTPException(status_code=400, detail="Invalid status")
    return mapping[key]


@app.get("/tools/merchant/orders/list")
def tools_merchant_orders_list(
    status: Optional[str] = Query(default=None),
    timeRange: str = Query(default="today"),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    keyword: Optional[str] = Query(default=None),
    sort: str = Query(default="createTimeDesc"),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=50),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    s, e, tr = _resolve_time_range(timeRange, start, end)
    statuses = _order_status_values(status)
    if sort not in {"createTimeDesc", "payTimeDesc", "timeoutRiskDesc"}:
        raise HTTPException(status_code=400, detail="Invalid sort")
    with get_conn(settings) as conn:
        data = get_merchant_orders_list(conn, user.user_id, statuses, keyword, sort, page, pageSize)
    data["filtersApplied"] = {"status": (status or "").upper() if status else None, "keyword": keyword or "", "sort": sort}
    data["timeRangeApplied"] = {"type": tr, "start": s.strftime("%Y-%m-%d %H:%M:%S"), "end": e.strftime("%Y-%m-%d %H:%M:%S"), "timezone": "Asia/Shanghai"}
    return ok(data)


@app.get("/tools/merchant/orders/{order_no}")
def tools_merchant_order_detail(
    order_no: str,
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    with get_conn(settings) as conn:
        order_row = get_merchant_order_row_by_no(conn, user.user_id, order_no)
        if not order_row:
            raise HTTPException(status_code=404, detail="Order not found")
        items = get_order_items_rows(conn, int(order_row["id"]))
    return ok(format_order_detail(order_row, items))


@app.get("/tools/merchant/inventory/low")
def tools_merchant_inventory_low(
    threshold: int = Query(default=7, ge=0, le=9999),
    limit: int = Query(default=20, ge=1, le=50),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    with get_conn(settings) as conn:
        data = get_merchant_inventory_low(conn, user.user_id, threshold, limit)
    return ok(data)


@app.get("/tools/merchant/inventory/forecast")
def tools_merchant_inventory_forecast(
    timeRange: str = Query(default="last30"),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    lowStockThreshold: int = Query(default=20, ge=0, le=9999),
    targetDays: int = Query(default=14, ge=1, le=180),
    limit: int = Query(default=20, ge=1, le=50),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    s, e, tr = _resolve_time_range(timeRange, start, end)
    with get_conn(settings) as conn:
        data = get_merchant_inventory_forecast(conn, user.user_id, s, e, lowStockThreshold, targetDays, limit)
    data["timeRangeApplied"] = {"type": tr, "start": s.strftime("%Y-%m-%d %H:%M:%S"), "end": e.strftime("%Y-%m-%d %H:%M:%S"), "timezone": "Asia/Shanghai"}
    return ok(data)


@app.get("/tools/merchant/diagnosis/overview")
def tools_merchant_diagnosis_overview(
    timeRange: str = Query(default="today"),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    s, e, tr = _resolve_time_range(timeRange, start, end)
    with get_conn(settings) as conn:
        data = get_merchant_diagnosis_overview(conn, user.user_id, s, e)
    data["timeRangeApplied"] = {"type": tr, "start": s.strftime("%Y-%m-%d %H:%M:%S"), "end": e.strftime("%Y-%m-%d %H:%M:%S"), "timezone": "Asia/Shanghai"}
    return ok(data)


@app.get("/tools/merchant/analytics/sales_trend")
def tools_merchant_sales_trend(
    metric: str = Query(default="gmv"),
    granularity: str = Query(default="day"),
    timeRange: str = Query(default="last7"),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    if metric not in {"gmv", "orders"}:
        raise HTTPException(status_code=400, detail="Invalid metric")
    if granularity != "day":
        raise HTTPException(status_code=400, detail="Invalid granularity")
    s, e, tr = _resolve_time_range(timeRange, start, end)
    with get_conn(settings) as conn:
        data = get_merchant_sales_trend(conn, user.user_id, metric, s, e)
    return ok(
        {
            "metric": data["metric"],
            "granularity": "day",
            "timeRangeApplied": {"type": tr, "start": s.strftime("%Y-%m-%d %H:%M:%S"), "end": e.strftime("%Y-%m-%d %H:%M:%S"), "timezone": "Asia/Shanghai"},
            "points": data["points"],
            "summary": {},
        }
    )


@app.get("/tools/merchant/analytics/top_products")
def tools_merchant_top_products(
    by: str = Query(default="gmv"),
    timeRange: str = Query(default="last7"),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    if by not in {"gmv", "sales"}:
        raise HTTPException(status_code=400, detail="Invalid by")
    s, e, tr = _resolve_time_range(timeRange, start, end)
    with get_conn(settings) as conn:
        data = get_merchant_top_products(conn, user.user_id, by, s, e, limit)
    return ok(
        {
            "by": data["by"],
            "timeRangeApplied": {"type": tr, "start": s.strftime("%Y-%m-%d %H:%M:%S"), "end": e.strftime("%Y-%m-%d %H:%M:%S"), "timezone": "Asia/Shanghai"},
            "items": data["items"],
        }
    )


@app.get("/tools/merchant/refunds/summary")
def tools_merchant_refunds_summary(
    timeRange: str = Query(default="last7"),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    s, e, tr = _resolve_time_range(timeRange, start, end)
    with get_conn(settings) as conn:
        data = get_merchant_refunds_summary(conn, user.user_id, s, e)
    return ok(
        {
            "timeRangeApplied": {"type": tr, "start": s.strftime("%Y-%m-%d %H:%M:%S"), "end": e.strftime("%Y-%m-%d %H:%M:%S"), "timezone": "Asia/Shanghai"},
            **data,
        }
    )


def _refund_status_values(status: Optional[str]) -> Optional[list[int]]:
    if not status:
        return None
    mapping = {"PENDING": [0], "APPROVED": [1], "REJECTED": [2], "REFUNDED": [1]}
    key = status.strip().upper()
    if key not in mapping:
        raise HTTPException(status_code=400, detail="Invalid status")
    return mapping[key]


@app.get("/tools/merchant/refunds/list")
def tools_merchant_refunds_list(
    status: Optional[str] = Query(default=None),
    timeRange: str = Query(default="last7"),
    start: Optional[str] = Query(default=None),
    end: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=50),
    settings: Settings = Depends(get_settings),
    user: AuthUser = Depends(current_seller_user),
):
    s, e, tr = _resolve_time_range(timeRange, start, end)
    statuses = _refund_status_values(status)
    with get_conn(settings) as conn:
        data = get_merchant_refunds_list(conn, user.user_id, statuses, s, e, page, pageSize)
    data["timeRangeApplied"] = {"type": tr, "start": s.strftime("%Y-%m-%d %H:%M:%S"), "end": e.strftime("%Y-%m-%d %H:%M:%S"), "timezone": "Asia/Shanghai"}
    return ok(data)
