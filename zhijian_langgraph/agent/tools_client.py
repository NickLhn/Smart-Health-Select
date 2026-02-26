from __future__ import annotations

from typing import Any, Dict, Optional

import httpx

from agent.settings import Settings


class ToolsClient:
    def __init__(self, settings: Settings):
        self._base_url = settings.tools_base_url
        self._timeout = httpx.Timeout(8.0, connect=3.0)
        self._trust_env = False

    def _headers(self, user_token: str, request_id: Optional[str] = None) -> Dict[str, str]:
        headers = {"Authorization": f"Bearer {user_token}"}
        if request_id:
            headers["X-Request-ID"] = request_id
        return headers

    def _request(
        self,
        method: str,
        path: str,
        user_token: str,
        request_id: Optional[str] = None,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        url = f"{self._base_url}{path}"
        try:
            with httpx.Client(timeout=self._timeout, trust_env=self._trust_env) as client:
                resp = client.request(
                    method, url, headers=self._headers(user_token, request_id=request_id), params=params, json=json
                )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as exc:
            detail = ""
            try:
                payload = exc.response.json()
                if isinstance(payload, dict):
                    detail = str(payload.get("detail") or "")
                else:
                    detail = str(payload)
            except Exception:
                detail = exc.response.text
            return {"success": False, "status_code": exc.response.status_code, "error": detail}
        except httpx.RequestError as exc:
            return {"success": False, "status_code": None, "error": type(exc).__name__}

    def get_recent_orders(
        self, user_token: str, limit: int = 5, request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request("GET", "/tools/orders/recent", user_token, request_id=request_id, params={"limit": limit})

    def get_order_detail(
        self, user_token: str, order_no: str, request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request("GET", f"/tools/orders/{order_no}", user_token, request_id=request_id)

    def get_recent_refunds(
        self, user_token: str, limit: int = 3, request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request(
            "GET", "/tools/refunds/recent", user_token, request_id=request_id, params={"limit": limit}
        )

    def get_refund_status(
        self, user_token: str, order_no: str, request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request(
            "GET", "/tools/refunds/status", user_token, request_id=request_id, params={"orderNo": order_no}
        )

    def get_recent_shipping(
        self, user_token: str, limit: int = 5, request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request(
            "GET", "/tools/shipping/recent", user_token, request_id=request_id, params={"limit": limit}
        )

    def get_shipping_status(
        self, user_token: str, order_no: str, request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request(
            "GET", "/tools/shipping/status", user_token, request_id=request_id, params={"orderNo": order_no}
        )

    def search_medicines(
        self, user_token: str, keyword: str, limit: int = 5, request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request(
            "GET",
            "/tools/medicines/search",
            user_token,
            request_id=request_id,
            params={"keyword": keyword, "limit": limit},
        )

    def medicines_list(
        self,
        user_token: str,
        keyword: Optional[str] = None,
        page: int = 1,
        size: int = 10,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "size": size}
        if keyword:
            params["keyword"] = keyword
        return self._request("GET", "/tools/medicines/list", user_token, request_id=request_id, params=params)

    def medicine_detail(
        self,
        user_token: str,
        medicine_id: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request("GET", f"/tools/medicines/{medicine_id}", user_token, request_id=request_id)

    def add_to_cart(
        self, user_token: str, medicine_id: int, count: int = 1, request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request(
            "POST",
            "/tools/cart/add",
            user_token,
            request_id=request_id,
            json={"medicineId": medicine_id, "count": count},
        )

    def get_cart_list(self, user_token: str, request_id: Optional[str] = None) -> Dict[str, Any]:
        return self._request("GET", "/tools/cart/list", user_token, request_id=request_id)

    def get_user_address_list(self, user_token: str, request_id: Optional[str] = None) -> Dict[str, Any]:
        return self._request("GET", "/tools/user/address/list", user_token, request_id=request_id)

    def admin_users_list(
        self,
        user_token: str,
        keyword: Optional[str] = None,
        status: Optional[int] = None,
        page: int = 1,
        size: int = 10,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "size": size}
        if keyword:
            params["keyword"] = keyword
        if status is not None:
            params["status"] = status
        return self._request("GET", "/tools/admin/users/list", user_token, request_id=request_id, params=params)

    def admin_user_detail(self, user_token: str, user_id: int, request_id: Optional[str] = None) -> Dict[str, Any]:
        return self._request("GET", f"/tools/admin/users/{user_id}", user_token, request_id=request_id)

    def admin_medicines_list(
        self,
        user_token: str,
        keyword: Optional[str] = None,
        status: Optional[int] = None,
        page: int = 1,
        size: int = 10,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "size": size}
        if keyword:
            params["keyword"] = keyword
        if status is not None:
            params["status"] = status
        return self._request("GET", "/tools/admin/medicines/list", user_token, request_id=request_id, params=params)

    def admin_medicine_detail(
        self,
        user_token: str,
        medicine_id: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request("GET", f"/tools/admin/medicines/{medicine_id}", user_token, request_id=request_id)

    def admin_preview_medicine_status(
        self,
        user_token: str,
        medicine_id: int,
        to_status: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "POST",
            f"/tools/admin/medicines/{medicine_id}/status/preview",
            user_token,
            request_id=request_id,
            params={"toStatus": to_status},
        )

    def admin_set_medicine_status(
        self,
        user_token: str,
        medicine_id: int,
        status: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "PATCH",
            f"/tools/admin/medicines/{medicine_id}/status",
            user_token,
            request_id=request_id,
            params={"status": status},
        )

    def admin_preview_medicine_delete(
        self,
        user_token: str,
        medicine_id: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "POST",
            f"/tools/admin/medicines/{medicine_id}/delete/preview",
            user_token,
            request_id=request_id,
        )

    def admin_delete_medicine(
        self,
        user_token: str,
        medicine_id: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "DELETE",
            f"/tools/admin/medicines/{medicine_id}",
            user_token,
            request_id=request_id,
        )

    def admin_orders_list(
        self,
        user_token: str,
        status: Optional[int] = None,
        page: int = 1,
        size: int = 10,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "size": size}
        if status is not None:
            params["status"] = status
        return self._request("GET", "/tools/admin/orders/list", user_token, request_id=request_id, params=params)

    def admin_order_detail(
        self,
        user_token: str,
        order_id: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request("GET", f"/tools/admin/orders/{order_id}", user_token, request_id=request_id)

    def admin_aftersales_list(
        self,
        user_token: str,
        status: Optional[int] = None,
        page: int = 1,
        size: int = 10,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "size": size}
        if status is not None:
            params["status"] = status
        return self._request("GET", "/tools/admin/aftersales/list", user_token, request_id=request_id, params=params)

    def admin_aftersales_detail(
        self,
        user_token: str,
        apply_id: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request("GET", f"/tools/admin/aftersales/{apply_id}", user_token, request_id=request_id)

    def admin_preview_aftersales_audit(
        self,
        user_token: str,
        apply_id: int,
        pass_: bool,
        audit_reason: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"pass": bool(pass_)}
        if audit_reason:
            params["auditReason"] = audit_reason
        return self._request(
            "POST",
            f"/tools/admin/aftersales/{apply_id}/audit/preview",
            user_token,
            request_id=request_id,
            params=params,
        )

    def admin_aftersales_audit(
        self,
        user_token: str,
        apply_id: int,
        pass_: bool,
        audit_reason: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"pass": bool(pass_)}
        if audit_reason:
            params["auditReason"] = audit_reason
        return self._request(
            "POST",
            f"/tools/admin/aftersales/{apply_id}/audit",
            user_token,
            request_id=request_id,
            params=params,
        )

    def admin_set_user_status(
        self,
        user_token: str,
        user_id: int,
        status: int,
        reason: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"status": status}
        if reason:
            params["reason"] = reason
        return self._request(
            "PATCH",
            f"/tools/admin/users/{user_id}/status",
            user_token,
            request_id=request_id,
            params=params,
        )

    def admin_merchants_list(
        self,
        user_token: str,
        keyword: Optional[str] = None,
        audit_status: Optional[int] = None,
        page: int = 1,
        size: int = 10,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "size": size}
        if keyword:
            params["keyword"] = keyword
        if audit_status is not None:
            params["auditStatus"] = audit_status
        return self._request("GET", "/tools/admin/merchants/list", user_token, request_id=request_id, params=params)

    def admin_merchant_detail(
        self,
        user_token: str,
        merchant_id: int,
        reveal_fields: Optional[list[str]] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if reveal_fields:
            params["revealFields"] = ",".join(reveal_fields)
        return self._request(
            "GET",
            f"/tools/admin/merchants/{merchant_id}",
            user_token,
            request_id=request_id,
            params=params if params else None,
        )

    def admin_preview_merchant_audit(
        self,
        user_token: str,
        merchant_id: int,
        audit_status: int,
        audit_remark: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"auditStatus": audit_status}
        if audit_remark:
            params["auditRemark"] = audit_remark
        return self._request(
            "POST",
            f"/tools/admin/merchants/{merchant_id}/audit/preview",
            user_token,
            request_id=request_id,
            params=params,
        )

    def admin_audit_merchant(
        self,
        user_token: str,
        merchant_id: int,
        audit_status: int,
        audit_remark: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"auditStatus": audit_status}
        if audit_remark:
            params["auditRemark"] = audit_remark
        return self._request(
            "PUT",
            f"/tools/admin/merchants/{merchant_id}/audit",
            user_token,
            request_id=request_id,
            params=params,
        )

    def create_order_from_cart(
        self,
        user_token: str,
        payload: Dict[str, Any],
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "POST",
            "/tools/orders/createFromCart",
            user_token,
            request_id=request_id,
            json=payload,
        )

    def merchant_dashboard_summary(
        self,
        user_token: str,
        time_range: str = "today",
        start: Optional[str] = None,
        end: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"timeRange": time_range}
        if start:
            params["start"] = start
        if end:
            params["end"] = end
        return self._request("GET", "/tools/merchant/dashboard/summary", user_token, request_id=request_id, params=params)

    def merchant_orders_pending_summary(self, user_token: str, request_id: Optional[str] = None) -> Dict[str, Any]:
        return self._request("GET", "/tools/merchant/orders/pending_summary", user_token, request_id=request_id)

    def merchant_orders_list(
        self,
        user_token: str,
        status: Optional[str] = None,
        time_range: str = "today",
        keyword: Optional[str] = None,
        sort: str = "createTimeDesc",
        page: int = 1,
        page_size: int = 20,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"timeRange": time_range, "sort": sort, "page": page, "pageSize": page_size}
        if status:
            params["status"] = status
        if keyword:
            params["keyword"] = keyword
        return self._request("GET", "/tools/merchant/orders/list", user_token, request_id=request_id, params=params)

    def merchant_order_detail(self, user_token: str, order_no: str, request_id: Optional[str] = None) -> Dict[str, Any]:
        return self._request("GET", f"/tools/merchant/orders/{order_no}", user_token, request_id=request_id)

    def merchant_inventory_low(
        self, user_token: str, threshold: int = 7, limit: int = 20, request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request(
            "GET",
            "/tools/merchant/inventory/low",
            user_token,
            request_id=request_id,
            params={"threshold": threshold, "limit": limit},
        )

    def merchant_inventory_forecast(
        self,
        user_token: str,
        time_range: str = "last30",
        low_stock_threshold: int = 20,
        target_days: int = 14,
        limit: int = 20,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "GET",
            "/tools/merchant/inventory/forecast",
            user_token,
            request_id=request_id,
            params={
                "timeRange": time_range,
                "lowStockThreshold": low_stock_threshold,
                "targetDays": target_days,
                "limit": limit,
            },
        )

    def merchant_diagnosis_overview(
        self,
        user_token: str,
        time_range: str = "today",
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "GET",
            "/tools/merchant/diagnosis/overview",
            user_token,
            request_id=request_id,
            params={"timeRange": time_range},
        )

    def merchant_products_search(
        self,
        user_token: str,
        keyword: str,
        limit: int = 5,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "GET",
            "/tools/merchant/products/search",
            user_token,
            request_id=request_id,
            params={"keyword": keyword, "limit": limit},
        )

    def merchant_medicines_list(
        self,
        user_token: str,
        keyword: Optional[str] = None,
        status: Optional[int] = None,
        page: int = 1,
        size: int = 10,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"page": page, "size": size}
        if keyword:
            params["keyword"] = keyword
        if status is not None:
            params["status"] = status
        return self._request("GET", "/tools/merchant/medicines/list", user_token, request_id=request_id, params=params)

    def merchant_medicine_detail(
        self,
        user_token: str,
        medicine_id: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request("GET", f"/tools/merchant/medicines/{medicine_id}", user_token, request_id=request_id)

    def merchant_preview_medicine_status(
        self,
        user_token: str,
        medicine_id: int,
        to_status: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "POST",
            f"/tools/merchant/medicines/{medicine_id}/status/preview",
            user_token,
            request_id=request_id,
            params={"toStatus": to_status},
        )

    def merchant_set_medicine_status(
        self,
        user_token: str,
        medicine_id: int,
        status: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "PATCH",
            f"/tools/merchant/medicines/{medicine_id}/status",
            user_token,
            request_id=request_id,
            params={"status": status},
        )

    def merchant_preview_medicine_delete(
        self,
        user_token: str,
        medicine_id: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "POST",
            f"/tools/merchant/medicines/{medicine_id}/delete/preview",
            user_token,
            request_id=request_id,
        )

    def merchant_delete_medicine(
        self,
        user_token: str,
        medicine_id: int,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "DELETE",
            f"/tools/merchant/medicines/{medicine_id}",
            user_token,
            request_id=request_id,
        )

    def merchant_sales_trend(
        self,
        user_token: str,
        metric: str = "gmv",
        granularity: str = "day",
        time_range: str = "last7",
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "GET",
            "/tools/merchant/analytics/sales_trend",
            user_token,
            request_id=request_id,
            params={"metric": metric, "granularity": granularity, "timeRange": time_range},
        )

    def merchant_top_products(
        self,
        user_token: str,
        by: str = "gmv",
        time_range: str = "last7",
        limit: int = 10,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self._request(
            "GET",
            "/tools/merchant/analytics/top_products",
            user_token,
            request_id=request_id,
            params={"by": by, "timeRange": time_range, "limit": limit},
        )

    def merchant_refunds_summary(
        self, user_token: str, time_range: str = "last7", request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return self._request(
            "GET", "/tools/merchant/refunds/summary", user_token, request_id=request_id, params={"timeRange": time_range}
        )

    def merchant_refunds_list(
        self,
        user_token: str,
        status: Optional[str] = None,
        time_range: str = "last7",
        page: int = 1,
        page_size: int = 20,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {"timeRange": time_range, "page": page, "pageSize": page_size}
        if status:
            params["status"] = status
        return self._request("GET", "/tools/merchant/refunds/list", user_token, request_id=request_id, params=params)
