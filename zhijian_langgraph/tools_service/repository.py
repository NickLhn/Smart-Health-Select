from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, Optional

import pymysql

from tools_service.db import fetch_all, fetch_one
from tools_service.formatters import (
    DELIVERY_STATUS_TEXT,
    ORDER_STATUS_TEXT,
    REFUND_APPLY_STATUS_TEXT,
    mask_address,
    mask_phone,
    to_decimal_str,
    to_iso,
)


def get_order_row_by_no(conn: pymysql.connections.Connection, user_id: int, order_no: str) -> Optional[Dict[str, Any]]:
    sql = """
        SELECT *
        FROM oms_order
        WHERE user_id = %s AND order_no = %s
        LIMIT 1
    """
    return fetch_one(conn, sql, (user_id, order_no))


def get_recent_orders_rows(conn: pymysql.connections.Connection, user_id: int, limit: int) -> list[Dict[str, Any]]:
    sql = """
        SELECT *
        FROM oms_order
        WHERE user_id = %s
        ORDER BY create_time DESC
        LIMIT %s
    """
    return fetch_all(conn, sql, (user_id, limit))


def get_order_items_rows(conn: pymysql.connections.Connection, order_id: int) -> list[Dict[str, Any]]:
    sql = """
        SELECT *
        FROM oms_order_item
        WHERE order_id = %s
        ORDER BY id ASC
    """
    return fetch_all(conn, sql, (order_id,))


def get_delivery_row_by_order_id(conn: pymysql.connections.Connection, order_id: int) -> Optional[Dict[str, Any]]:
    sql = """
        SELECT
            d.*,
            o.status AS order_status,
            o.create_time AS order_create_time,
            o.payment_time AS order_payment_time,
            o.delivery_time AS order_delivery_time,
            o.finish_time AS order_finish_time
        FROM oms_delivery d
        INNER JOIN oms_order o ON o.id = d.order_id
        WHERE d.order_id = %s
        ORDER BY d.id DESC
        LIMIT 1
    """
    return fetch_one(conn, sql, (order_id,))


def get_recent_shipping_rows(conn: pymysql.connections.Connection, user_id: int, limit: int) -> list[Dict[str, Any]]:
    sql = """
        SELECT
            o.id AS order_id,
            o.order_no AS order_no,
            o.status AS order_status,
            o.create_time AS order_create_time,
            d.id AS delivery_id,
            d.status AS delivery_status,
            d.update_time AS delivery_update_time
        FROM oms_order o
        INNER JOIN oms_delivery d ON d.order_id = o.id
        WHERE o.user_id = %s
        ORDER BY o.create_time DESC
        LIMIT %s
    """
    return fetch_all(conn, sql, (user_id, limit))


def get_recent_refund_apply_rows(conn: pymysql.connections.Connection, user_id: int, limit: int) -> list[Dict[str, Any]]:
    sql = """
        SELECT
            r.id AS refund_apply_id,
            r.order_id AS order_id,
            r.user_id AS user_id,
            r.status AS refund_status,
            r.amount AS refund_amount,
            r.reason AS refund_reason,
            r.audit_time AS audit_time,
            r.audit_reason AS audit_reason,
            r.create_time AS create_time,
            o.order_no AS order_no
        FROM oms_refund_apply r
        INNER JOIN oms_order o ON o.id = r.order_id
        WHERE r.user_id = %s
        ORDER BY r.create_time DESC
        LIMIT %s
    """
    return fetch_all(conn, sql, (user_id, limit))


def get_refund_apply_by_order_id(conn: pymysql.connections.Connection, user_id: int, order_id: int) -> Optional[Dict[str, Any]]:
    sql = """
        SELECT *
        FROM oms_refund_apply
        WHERE user_id = %s AND order_id = %s
        ORDER BY id DESC
        LIMIT 1
    """
    return fetch_one(conn, sql, (user_id, order_id))


def get_refund_payment_rows(conn: pymysql.connections.Connection, user_id: int, order_id: int) -> list[Dict[str, Any]]:
    sql = """
        SELECT *
        FROM oms_payment_record
        WHERE user_id = %s AND order_id = %s AND amount < 0
        ORDER BY create_time DESC
    """
    return fetch_all(conn, sql, (user_id, order_id))


def format_order_detail(order_row: Dict[str, Any], item_rows: list[Dict[str, Any]]) -> Dict[str, Any]:
    order_status = int(order_row.get("status"))
    order = {
        "orderNo": order_row.get("order_no"),
        "status": order_status,
        "statusText": ORDER_STATUS_TEXT.get(order_status, str(order_status)),
        "totalAmount": to_decimal_str(order_row.get("total_amount")),
        "couponAmount": to_decimal_str(order_row.get("coupon_amount")),
        "payAmount": to_decimal_str(order_row.get("pay_amount")),
        "createTime": to_iso(order_row.get("create_time")),
        "paymentTime": to_iso(order_row.get("payment_time")),
        "deliveryTime": to_iso(order_row.get("delivery_time")),
        "finishTime": to_iso(order_row.get("finish_time")),
        "pharmacistAuditStatus": int(order_row.get("pharmacist_audit_status") or 0),
        "pickupCode": order_row.get("pickup_code"),
        "receiveCode": order_row.get("receive_code"),
        "refundReason": order_row.get("refund_reason"),
        "prescriptionImage": order_row.get("prescription_image"),
        "receiverName": order_row.get("receiver_name"),
        "receiverPhoneMasked": mask_phone(order_row.get("receiver_phone")),
        "receiverAddressMasked": mask_address(order_row.get("receiver_address")),
    }

    items: list[Dict[str, Any]] = []
    for row in item_rows:
        items.append(
            {
                "name": row.get("medicine_name"),
                "price": to_decimal_str(row.get("medicine_price")),
                "quantity": int(row.get("quantity")),
                "totalPrice": to_decimal_str(row.get("total_price")),
            }
        )

    return {"order": order, "items": items}


def format_recent_orders(rows: list[Dict[str, Any]]) -> Dict[str, Any]:
    items: list[Dict[str, Any]] = []
    for row in rows:
        status = int(row.get("status"))
        order_no = row.get("order_no")
        pay_amount = to_decimal_str(row.get("pay_amount"))
        create_time = to_iso(row.get("create_time"))
        status_text = ORDER_STATUS_TEXT.get(status, str(status))
        display_title = f"订单 {order_no}｜{status_text}｜实付 {pay_amount}"
        items.append(
            {
                "selectKey": order_no,
                "displayTitle": display_title,
                "createTime": create_time,
                "statusText": status_text,
            }
        )
    return {"items": items}


def format_recent_refunds(rows: list[Dict[str, Any]]) -> Dict[str, Any]:
    items: list[Dict[str, Any]] = []
    for row in rows:
        status = int(row.get("refund_status"))
        order_no = row.get("order_no")
        amount = to_decimal_str(row.get("refund_amount"))
        create_time = to_iso(row.get("create_time"))
        status_text = REFUND_APPLY_STATUS_TEXT.get(status, str(status))
        display_title = f"退款申请 {row.get('refund_apply_id')}｜订单 {order_no}｜{status_text}｜金额 {amount}"
        items.append(
            {
                "selectKey": str(row.get("refund_apply_id")),
                "displayTitle": display_title,
                "createTime": create_time,
                "statusText": status_text,
                "orderNo": order_no,
            }
        )
    return {"items": items}


def format_recent_shipping(rows: list[Dict[str, Any]]) -> Dict[str, Any]:
    items: list[Dict[str, Any]] = []
    for row in rows:
        delivery_status = int(row.get("delivery_status"))
        order_no = row.get("order_no")
        status_text = DELIVERY_STATUS_TEXT.get(delivery_status, str(delivery_status))
        display_title = f"订单 {order_no}｜配送 {status_text}"
        items.append(
            {
                "selectKey": order_no,
                "displayTitle": display_title,
                "createTime": to_iso(row.get("order_create_time")),
                "statusText": status_text,
            }
        )
    return {"items": items}


def format_shipping_status(order_no: str, delivery_row: Dict[str, Any]) -> Dict[str, Any]:
    status = int(delivery_row.get("status"))
    order_status = int(delivery_row.get("order_status") or 0)
    order_create_time = to_iso(delivery_row.get("order_create_time"))
    order_payment_time = to_iso(delivery_row.get("order_payment_time"))
    order_delivery_time = to_iso(delivery_row.get("order_delivery_time"))
    order_finish_time = to_iso(delivery_row.get("order_finish_time"))
    delivery_create_time = to_iso(delivery_row.get("create_time"))
    delivery_update_time = to_iso(delivery_row.get("update_time"))

    track: list[Dict[str, Any]] = []
    if order_create_time:
        track.append({"time": order_create_time, "text": "订单已提交"})
    if order_payment_time:
        track.append({"time": order_payment_time, "text": "订单已支付"})
    if order_delivery_time:
        track.append({"time": order_delivery_time, "text": "商家已发货"})
    if delivery_create_time:
        track.append({"time": delivery_create_time, "text": "配送单已创建"})
    if delivery_update_time:
        status_text = DELIVERY_STATUS_TEXT.get(status, str(status))
        track.append({"time": delivery_update_time, "text": f"配送状态更新：{status_text}"})

    exception_status = int(delivery_row.get("exception_status") or 0)
    exception_reason = delivery_row.get("exception_reason")
    if exception_status:
        track.append({"time": delivery_update_time, "text": f"配送异常：{exception_reason or '暂无'}"})

    if order_finish_time:
        track.append({"time": order_finish_time, "text": "订单已完成"})
    return {
        "delivery": {
            "orderNo": order_no,
            "status": status,
            "statusText": DELIVERY_STATUS_TEXT.get(status, str(status)),
            "orderStatus": order_status,
            "orderStatusText": ORDER_STATUS_TEXT.get(order_status, str(order_status)),
            "shopName": delivery_row.get("shop_name"),
            "shopAddress": delivery_row.get("shop_address"),
            "courierName": delivery_row.get("courier_name"),
            "courierPhoneMasked": mask_phone(delivery_row.get("courier_phone")),
            "receiverName": delivery_row.get("receiver_name"),
            "receiverPhoneMasked": mask_phone(delivery_row.get("receiver_phone")),
            "receiverAddressMasked": mask_address(delivery_row.get("receiver_address")),
            "deliveryFee": to_decimal_str(delivery_row.get("delivery_fee")),
            "proofImageUrl": delivery_row.get("proof_image"),
            "isUrgent": int(delivery_row.get("is_urgent") or 0),
            "verifyCode": delivery_row.get("verify_code"),
            "exceptionStatus": exception_status,
            "exceptionReason": exception_reason,
            "createTime": delivery_create_time,
            "updateTime": delivery_update_time,
            "track": track,
        }
    }


def format_refund_status(order_no: str, refund_apply_row: Dict[str, Any], refund_payment_rows: list[Dict[str, Any]]) -> Dict[str, Any]:
    status = int(refund_apply_row.get("status"))
    refund_apply = {
        "id": refund_apply_row.get("id"),
        "orderNo": order_no,
        "status": status,
        "statusText": REFUND_APPLY_STATUS_TEXT.get(status, str(status)),
        "reason": refund_apply_row.get("reason"),
        "amount": to_decimal_str(refund_apply_row.get("amount")),
        "auditTime": to_iso(refund_apply_row.get("audit_time")),
        "auditReason": refund_apply_row.get("audit_reason"),
        "createTime": to_iso(refund_apply_row.get("create_time")),
    }

    refund_payments: list[Dict[str, Any]] = []
    refunded_amount = Decimal("0.00")
    refunded_at: Optional[str] = None

    for row in refund_payment_rows:
        amount = row.get("amount")
        status_raw = row.get("status")
        create_time = to_iso(row.get("create_time"))
        refund_payments.append(
            {
                "amount": to_decimal_str(amount),
                "transactionId": row.get("transaction_id"),
                "status": status_raw,
                "createTime": create_time,
            }
        )

        try:
            status_int = int(status_raw)
        except (TypeError, ValueError):
            status_int = None

        if status_int in {1, 3} and isinstance(amount, Decimal) and amount < 0:
            refunded_amount += -amount
            if refunded_at is None:
                refunded_at = create_time

    summary = {
        "isRefunded": refunded_amount > 0,
        "refundedAmount": format(refunded_amount, "f"),
        "refundedAt": refunded_at,
    }

    return {"refundApply": refund_apply, "refundPayments": refund_payments, "summary": summary}


def get_medicine_search_rows(conn: pymysql.connections.Connection, keyword: str, limit: int) -> list[Dict[str, Any]]:
    kw = (keyword or "").strip()
    sql = """
        SELECT
            id,
            name,
            main_image,
            price,
            stock,
            sales,
            specs,
            indication,
            usage_method,
            contraindication,
            status
        FROM pms_medicine
        WHERE deleted = 0 AND status = 1 AND (
            name LIKE %s OR indication LIKE %s
        )
        ORDER BY sales DESC, id DESC
        LIMIT %s
    """
    like = f"%{kw}%"
    return fetch_all(conn, sql, (like, like, limit))


def get_merchant_product_search_rows(
    conn: pymysql.connections.Connection,
    seller_id: int,
    keyword: str,
    limit: int,
) -> list[Dict[str, Any]]:
    kw = (keyword or "").strip()
    limit = max(1, min(int(limit or 5), 20))
    sql = """
        SELECT
            id,
            name,
            main_image,
            price,
            stock,
            sales,
            specs,
            indication,
            usage_method,
            contraindication,
            status
        FROM pms_medicine
        WHERE seller_id = %s AND deleted = 0 AND status = 1 AND (
            name LIKE %s OR indication LIKE %s
        )
        ORDER BY sales DESC, id DESC
        LIMIT %s
    """
    like = f"%{kw}%"
    return fetch_all(conn, sql, (seller_id, like, like, limit))


def format_medicine_cards(rows: list[Dict[str, Any]]) -> Dict[str, Any]:
    items: list[Dict[str, Any]] = []
    for row in rows:
        items.append(
            {
                "id": int(row.get("id")),
                "name": row.get("name"),
                "price": float(row.get("price") or 0),
                "stock": int(row.get("stock") or 0),
                "sales": int(row.get("sales") or 0),
                "mainImage": row.get("main_image") or "",
                "specs": row.get("specs"),
                "indication": row.get("indication"),
                "usageMethod": row.get("usage_method"),
                "contraindication": row.get("contraindication"),
                "status": int(row.get("status") or 0),
            }
        )
    return {"items": items}


def get_merchant_dashboard_summary(
    conn: pymysql.connections.Connection,
    seller_id: int,
    start: datetime,
    end: datetime,
    low_stock_threshold: int,
) -> Dict[str, Any]:
    sql_total = """
        SELECT COUNT(1) AS cnt
        FROM oms_order
        WHERE seller_id = %s AND create_time >= %s AND create_time <= %s
    """
    total = fetch_one(conn, sql_total, (seller_id, start, end)) or {}

    sql_paid = """
        SELECT COUNT(1) AS cnt, COALESCE(SUM(pay_amount), 0) AS gmv
        FROM oms_order
        WHERE seller_id = %s AND payment_time IS NOT NULL AND payment_time >= %s AND payment_time <= %s
    """
    paid = fetch_one(conn, sql_paid, (seller_id, start, end)) or {}

    sql_refund = """
        SELECT COUNT(1) AS cnt, COALESCE(SUM(r.amount), 0) AS amount
        FROM oms_refund_apply r
        INNER JOIN oms_order o ON o.id = r.order_id
        WHERE o.seller_id = %s AND r.status = 1 AND r.create_time >= %s AND r.create_time <= %s
    """
    refund = fetch_one(conn, sql_refund, (seller_id, start, end)) or {}

    sql_pending_ship = """
        SELECT COUNT(1) AS cnt
        FROM oms_order
        WHERE seller_id = %s AND status IN (1, 20, 30)
    """
    pending_ship = fetch_one(conn, sql_pending_ship, (seller_id,)) or {}

    sql_pending_audit = """
        SELECT COUNT(1) AS cnt
        FROM oms_order
        WHERE seller_id = %s AND (status = 7 OR pharmacist_audit_status = 1)
    """
    pending_audit = fetch_one(conn, sql_pending_audit, (seller_id,)) or {}

    sql_low_stock = """
        SELECT COUNT(1) AS cnt
        FROM pms_medicine
        WHERE seller_id = %s AND deleted = 0 AND status = 1 AND stock <= %s
    """
    low_stock = fetch_one(conn, sql_low_stock, (seller_id, low_stock_threshold)) or {}

    orders_total = int(total.get("cnt") or 0)
    orders_paid = int(paid.get("cnt") or 0)
    gmv_raw = paid.get("gmv") if paid.get("gmv") is not None else Decimal("0.00")
    refund_amount_raw = refund.get("amount") if refund.get("amount") is not None else Decimal("0.00")

    aov = Decimal("0.00")
    if orders_paid > 0 and isinstance(gmv_raw, Decimal):
        aov = (gmv_raw / Decimal(orders_paid)).quantize(Decimal("0.01"))

    return {
        "ordersTotal": orders_total,
        "ordersPaid": orders_paid,
        "gmv": to_decimal_str(gmv_raw),
        "aov": format(aov, "f"),
        "refundAmount": to_decimal_str(refund_amount_raw),
        "refundCount": int(refund.get("cnt") or 0),
        "pendingShipCount": int(pending_ship.get("cnt") or 0),
        "pendingAuditCount": int(pending_audit.get("cnt") or 0),
        "lowStockSkuCount": int(low_stock.get("cnt") or 0),
    }


def get_merchant_pending_summary(conn: pymysql.connections.Connection, seller_id: int) -> Dict[str, Any]:
    sql_ship = """
        SELECT COUNT(1) AS cnt
        FROM oms_order
        WHERE seller_id = %s AND status IN (1, 20, 30)
    """
    wait_ship = fetch_one(conn, sql_ship, (seller_id,)) or {}

    sql_audit = """
        SELECT COUNT(1) AS cnt
        FROM oms_order
        WHERE seller_id = %s AND (status = 7 OR pharmacist_audit_status = 1)
    """
    wait_audit = fetch_one(conn, sql_audit, (seller_id,)) or {}

    sql_refund = """
        SELECT COUNT(1) AS cnt
        FROM oms_refund_apply r
        INNER JOIN oms_order o ON o.id = r.order_id
        WHERE o.seller_id = %s AND r.status = 0
    """
    wait_refund = fetch_one(conn, sql_refund, (seller_id,)) or {}

    return {
        "waitShip": int(wait_ship.get("cnt") or 0),
        "waitAudit": int(wait_audit.get("cnt") or 0),
        "waitRefund": int(wait_refund.get("cnt") or 0),
    }


def get_merchant_order_row_by_no(conn: pymysql.connections.Connection, seller_id: int, order_no: str) -> Optional[Dict[str, Any]]:
    sql = """
        SELECT *
        FROM oms_order
        WHERE seller_id = %s AND order_no = %s
        LIMIT 1
    """
    return fetch_one(conn, sql, (seller_id, order_no))


def get_merchant_orders_list(
    conn: pymysql.connections.Connection,
    seller_id: int,
    statuses: Optional[list[int]],
    keyword: Optional[str],
    sort: str,
    page: int,
    page_size: int,
) -> Dict[str, Any]:
    page = max(1, int(page or 1))
    page_size = max(1, min(int(page_size or 20), 50))
    offset = (page - 1) * page_size

    kw = (keyword or "").strip()
    where = ["o.seller_id = %s"]
    args: list[Any] = [seller_id]

    if statuses:
        where.append("o.status IN (" + ",".join(["%s"] * len(statuses)) + ")")
        args.extend(statuses)

    if kw:
        like = f"%{kw}%"
        where.append("(o.order_no LIKE %s OR o.receiver_name LIKE %s OR o.receiver_phone LIKE %s)")
        args.extend([like, like, like])

    where_sql = " AND ".join(where)

    sql_count = f"""
        SELECT COUNT(1) AS cnt
        FROM oms_order o
        WHERE {where_sql}
    """
    total = fetch_one(conn, sql_count, tuple(args)) or {}

    order_by = "o.create_time DESC"
    if sort == "payTimeDesc":
        order_by = "o.payment_time DESC, o.create_time DESC"
    elif sort == "timeoutRiskDesc":
        order_by = "o.create_time ASC"

    sql = f"""
        SELECT
            o.*,
            COALESCE(GROUP_CONCAT(CONCAT(i.medicine_name, '×', i.quantity) ORDER BY i.id ASC SEPARATOR '、'), '') AS items_summary
        FROM oms_order o
        LEFT JOIN oms_order_item i ON i.order_id = o.id
        WHERE {where_sql}
        GROUP BY o.id
        ORDER BY {order_by}
        LIMIT %s OFFSET %s
    """
    list_args = list(args) + [page_size, offset]
    rows = fetch_all(conn, sql, tuple(list_args))

    items: list[Dict[str, Any]] = []
    for row in rows:
        status = int(row.get("status") or 0)
        items.append(
            {
                "orderNo": row.get("order_no"),
                "status": status,
                "statusText": ORDER_STATUS_TEXT.get(status, str(status)),
                "payAmount": to_decimal_str(row.get("pay_amount")),
                "createTime": to_iso(row.get("create_time")),
                "payTime": to_iso(row.get("payment_time")),
                "receiverName": row.get("receiver_name"),
                "receiverPhoneMasked": mask_phone(row.get("receiver_phone")),
                "itemsSummary": row.get("items_summary") or "",
            }
        )

    return {
        "page": page,
        "pageSize": page_size,
        "total": int(total.get("cnt") or 0),
        "items": items,
    }


def get_merchant_inventory_low(
    conn: pymysql.connections.Connection,
    seller_id: int,
    threshold: int,
    limit: int,
) -> Dict[str, Any]:
    limit = max(1, min(int(limit or 20), 50))
    threshold = max(0, int(threshold or 7))
    sql = """
        SELECT id, name, stock
        FROM pms_medicine
        WHERE seller_id = %s AND deleted = 0 AND status = 1 AND stock <= %s
        ORDER BY stock ASC, id DESC
        LIMIT %s
    """
    rows = fetch_all(conn, sql, (seller_id, threshold, limit))
    items: list[Dict[str, Any]] = []
    for row in rows:
        stock = int(row.get("stock") or 0)
        items.append(
            {
                "productId": int(row.get("id") or 0),
                "name": row.get("name"),
                "stock": stock,
                "suggestQty": max(0, 20 - stock),
            }
        )
    return {"threshold": threshold, "items": items}


def get_merchant_inventory_forecast(
    conn: pymysql.connections.Connection,
    seller_id: int,
    start: datetime,
    end: datetime,
    low_stock_threshold: int,
    target_days: int,
    limit: int,
) -> Dict[str, Any]:
    limit = max(1, min(int(limit or 20), 50))
    low_stock_threshold = max(0, int(low_stock_threshold or 20))
    target_days = max(1, min(int(target_days or 14), 180))

    day_count = (end.date() - start.date()).days + 1
    day_count = max(1, day_count)

    sql = """
        SELECT
            m.id AS product_id,
            m.name AS name,
            m.stock AS stock,
            COALESCE(s.sales_qty, 0) AS sales_qty
        FROM pms_medicine m
        LEFT JOIN (
            SELECT
                i.medicine_id AS medicine_id,
                COALESCE(SUM(i.quantity), 0) AS sales_qty
            FROM oms_order_item i
            INNER JOIN oms_order o ON o.id = i.order_id
            WHERE o.seller_id = %s AND o.payment_time IS NOT NULL AND o.payment_time >= %s AND o.payment_time <= %s
            GROUP BY i.medicine_id
        ) s ON s.medicine_id = m.id
        WHERE m.seller_id = %s AND m.status = 1 AND (s.sales_qty > 0 OR m.stock <= %s)
        ORDER BY s.sales_qty DESC, m.stock ASC, m.id DESC
        LIMIT %s
    """
    rows = fetch_all(conn, sql, (seller_id, start, end, seller_id, low_stock_threshold, limit))

    items: list[Dict[str, Any]] = []
    for row in rows:
        stock = int(row.get("stock") or 0)
        sales_qty = int(row.get("sales_qty") or 0)
        avg_daily_sales = 0.0
        days_of_supply: Optional[float] = None
        if sales_qty > 0:
            avg_daily_sales = sales_qty / float(day_count)
            if avg_daily_sales > 0:
                days_of_supply = stock / avg_daily_sales

        risk = "UNKNOWN"
        if days_of_supply is not None:
            if days_of_supply < 3:
                risk = "CRITICAL"
            elif days_of_supply < 7:
                risk = "WARN"
            else:
                risk = "OK"
        else:
            if stock <= low_stock_threshold:
                risk = "WARN"

        recommend_qty = 0
        if days_of_supply is not None:
            recommend_qty = max(0, int((target_days * avg_daily_sales) - stock + 0.9999))
        else:
            recommend_qty = max(0, 20 - stock)

        items.append(
            {
                "productId": int(row.get("product_id") or 0),
                "name": row.get("name"),
                "stock": stock,
                "salesQty": sales_qty,
                "lookbackDays": day_count,
                "avgDailySales": round(avg_daily_sales, 3),
                "daysOfSupply": None if days_of_supply is None else round(days_of_supply, 2),
                "riskLevel": risk,
                "recommendReplenishQty": recommend_qty,
                "targetDays": target_days,
            }
        )

    items.sort(
        key=lambda it: (
            0 if it["riskLevel"] == "CRITICAL" else 1 if it["riskLevel"] == "WARN" else 2 if it["riskLevel"] == "OK" else 3,
            999999 if it["daysOfSupply"] is None else float(it["daysOfSupply"]),
            int(it.get("stock") or 0),
        )
    )
    return {"start": to_iso(start), "end": to_iso(end), "items": items[:limit]}


def get_merchant_diagnosis_overview(
    conn: pymysql.connections.Connection,
    seller_id: int,
    start: datetime,
    end: datetime,
) -> Dict[str, Any]:
    delta_seconds = int((end - start).total_seconds())
    delta_seconds = max(0, delta_seconds)
    prev_end = start - timedelta(seconds=1)
    prev_start = prev_end - timedelta(seconds=delta_seconds)

    sql_paid = """
        SELECT COUNT(1) AS cnt, COALESCE(SUM(pay_amount), 0) AS gmv
        FROM oms_order
        WHERE seller_id = %s AND payment_time IS NOT NULL AND payment_time >= %s AND payment_time <= %s
    """
    cur = fetch_one(conn, sql_paid, (seller_id, start, end)) or {}
    prev = fetch_one(conn, sql_paid, (seller_id, prev_start, prev_end)) or {}

    cur_paid = int(cur.get("cnt") or 0)
    prev_paid = int(prev.get("cnt") or 0)
    cur_gmv = cur.get("gmv") if cur.get("gmv") is not None else Decimal("0.00")
    prev_gmv = prev.get("gmv") if prev.get("gmv") is not None else Decimal("0.00")

    cur_aov = Decimal("0.00")
    prev_aov = Decimal("0.00")
    if cur_paid > 0 and isinstance(cur_gmv, Decimal):
        cur_aov = (cur_gmv / Decimal(cur_paid)).quantize(Decimal("0.01"))
    if prev_paid > 0 and isinstance(prev_gmv, Decimal):
        prev_aov = (prev_gmv / Decimal(prev_paid)).quantize(Decimal("0.01"))

    def pct(cur_val: float, prev_val: float) -> Optional[float]:
        if prev_val == 0:
            return None
        return (cur_val - prev_val) / prev_val

    return {
        "timeRange": {"start": to_iso(start), "end": to_iso(end)},
        "compareRange": {"start": to_iso(prev_start), "end": to_iso(prev_end)},
        "current": {"ordersPaid": cur_paid, "gmv": to_decimal_str(cur_gmv), "aov": format(cur_aov, "f")},
        "previous": {"ordersPaid": prev_paid, "gmv": to_decimal_str(prev_gmv), "aov": format(prev_aov, "f")},
        "delta": {
            "ordersPaidPct": pct(float(cur_paid), float(prev_paid)),
            "gmvPct": pct(float(cur_gmv), float(prev_gmv)),
            "aovPct": pct(float(cur_aov), float(prev_aov)),
        },
    }

def get_merchant_sales_trend(
    conn: pymysql.connections.Connection,
    seller_id: int,
    metric: str,
    start: datetime,
    end: datetime,
) -> Dict[str, Any]:
    if metric == "orders":
        sql = """
            SELECT DATE(payment_time) AS d, COUNT(1) AS v
            FROM oms_order
            WHERE seller_id = %s AND payment_time IS NOT NULL AND payment_time >= %s AND payment_time <= %s
            GROUP BY DATE(payment_time)
            ORDER BY d ASC
        """
        rows = fetch_all(conn, sql, (seller_id, start, end))
        points = [{"date": str(r.get("d")), "value": str(int(r.get("v") or 0))} for r in rows]
        return {"metric": "orders", "points": points}

    sql = """
        SELECT DATE(payment_time) AS d, COALESCE(SUM(pay_amount), 0) AS v
        FROM oms_order
        WHERE seller_id = %s AND payment_time IS NOT NULL AND payment_time >= %s AND payment_time <= %s
        GROUP BY DATE(payment_time)
        ORDER BY d ASC
    """
    rows = fetch_all(conn, sql, (seller_id, start, end))
    points = [{"date": str(r.get("d")), "value": to_decimal_str(r.get("v")) or "0.00"} for r in rows]
    return {"metric": "gmv", "points": points}


def get_merchant_top_products(
    conn: pymysql.connections.Connection,
    seller_id: int,
    by: str,
    start: datetime,
    end: datetime,
    limit: int,
) -> Dict[str, Any]:
    limit = max(1, min(int(limit or 10), 50))
    order_by = "gmv DESC, sales DESC"
    if by == "sales":
        order_by = "sales DESC, gmv DESC"
    sql = f"""
        SELECT
            i.medicine_id AS product_id,
            i.medicine_name AS name,
            COALESCE(SUM(i.quantity), 0) AS sales,
            COALESCE(SUM(i.total_price), 0) AS gmv
        FROM oms_order_item i
        INNER JOIN oms_order o ON o.id = i.order_id
        WHERE o.seller_id = %s AND o.payment_time IS NOT NULL AND o.payment_time >= %s AND o.payment_time <= %s
        GROUP BY i.medicine_id, i.medicine_name
        ORDER BY {order_by}
        LIMIT %s
    """
    rows = fetch_all(conn, sql, (seller_id, start, end, limit))
    items: list[Dict[str, Any]] = []
    for row in rows:
        items.append(
            {
                "productId": int(row.get("product_id") or 0),
                "name": row.get("name"),
                "gmv": to_decimal_str(row.get("gmv")) or "0.00",
                "sales": int(row.get("sales") or 0),
            }
        )
    return {"by": by, "items": items}


def get_merchant_refunds_summary(
    conn: pymysql.connections.Connection,
    seller_id: int,
    start: datetime,
    end: datetime,
) -> Dict[str, Any]:
    sql_paid = """
        SELECT COUNT(1) AS cnt
        FROM oms_order
        WHERE seller_id = %s AND payment_time IS NOT NULL AND payment_time >= %s AND payment_time <= %s
    """
    paid = fetch_one(conn, sql_paid, (seller_id, start, end)) or {}
    orders_paid = int(paid.get("cnt") or 0)

    sql_refund = """
        SELECT COUNT(1) AS cnt, COALESCE(SUM(r.amount), 0) AS amount
        FROM oms_refund_apply r
        INNER JOIN oms_order o ON o.id = r.order_id
        WHERE o.seller_id = %s AND r.status = 1 AND r.create_time >= %s AND r.create_time <= %s
    """
    refund = fetch_one(conn, sql_refund, (seller_id, start, end)) or {}
    refund_count = int(refund.get("cnt") or 0)
    refund_amount = refund.get("amount") if refund.get("amount") is not None else Decimal("0.00")
    refund_rate = 0.0
    if orders_paid > 0:
        refund_rate = refund_count / float(orders_paid)

    sql_reasons = """
        SELECT r.reason AS reason, COUNT(1) AS cnt
        FROM oms_refund_apply r
        INNER JOIN oms_order o ON o.id = r.order_id
        WHERE o.seller_id = %s AND r.status = 1 AND r.create_time >= %s AND r.create_time <= %s
        GROUP BY r.reason
        ORDER BY cnt DESC
        LIMIT 5
    """
    rows = fetch_all(conn, sql_reasons, (seller_id, start, end))
    reasons: list[Dict[str, Any]] = []
    for row in rows:
        c = int(row.get("cnt") or 0)
        rate = 0.0
        if refund_count > 0:
            rate = c / float(refund_count)
        reasons.append({"reason": row.get("reason") or "", "count": c, "rate": rate})

    return {
        "refundCount": refund_count,
        "refundAmount": to_decimal_str(refund_amount),
        "refundRate": refund_rate,
        "topReasons": reasons,
    }


def get_merchant_refunds_list(
    conn: pymysql.connections.Connection,
    seller_id: int,
    status_values: Optional[list[int]],
    start: datetime,
    end: datetime,
    page: int,
    page_size: int,
) -> Dict[str, Any]:
    page = max(1, int(page or 1))
    page_size = max(1, min(int(page_size or 20), 50))
    offset = (page - 1) * page_size

    where = [
        "o.seller_id = %s",
        "r.create_time >= %s",
        "r.create_time <= %s",
    ]
    args: list[Any] = [seller_id, start, end]

    if status_values:
        where.append("r.status IN (" + ",".join(["%s"] * len(status_values)) + ")")
        args.extend(status_values)

    where_sql = " AND ".join(where)

    sql_count = f"""
        SELECT COUNT(1) AS cnt
        FROM oms_refund_apply r
        INNER JOIN oms_order o ON o.id = r.order_id
        WHERE {where_sql}
    """
    total = fetch_one(conn, sql_count, tuple(args)) or {}

    sql = f"""
        SELECT
            r.id AS refund_no,
            r.status AS refund_status,
            r.amount AS amount,
            r.reason AS reason,
            r.create_time AS create_time,
            o.order_no AS order_no,
            COALESCE(pr.refunded, 0) AS refunded
        FROM oms_refund_apply r
        INNER JOIN oms_order o ON o.id = r.order_id
        LEFT JOIN (
            SELECT
                order_id,
                MAX(CASE WHEN amount < 0 AND status IN (1, 3) THEN 1 ELSE 0 END) AS refunded
            FROM oms_payment_record
            GROUP BY order_id
        ) pr ON pr.order_id = r.order_id
        WHERE {where_sql}
        ORDER BY r.create_time DESC
        LIMIT %s OFFSET %s
    """
    list_args = list(args) + [page_size, offset]
    rows = fetch_all(conn, sql, tuple(list_args))

    items: list[Dict[str, Any]] = []
    for row in rows:
        status = int(row.get("refund_status") or 0)
        refunded = int(row.get("refunded") or 0) == 1
        status_key = "PENDING"
        if status == 1:
            status_key = "REFUNDED" if refunded else "APPROVED"
        elif status == 2:
            status_key = "REJECTED"
        items.append(
            {
                "refundNo": str(row.get("refund_no")),
                "orderNo": row.get("order_no"),
                "status": status_key,
                "amount": to_decimal_str(row.get("amount")),
                "reason": row.get("reason"),
                "createTime": to_iso(row.get("create_time")),
            }
        )

    return {"page": page, "pageSize": page_size, "total": int(total.get("cnt") or 0), "items": items}
