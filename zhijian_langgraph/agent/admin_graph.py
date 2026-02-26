from __future__ import annotations

import re
from typing import Any, Literal, Optional, TypedDict

from langgraph.graph import END, StateGraph

from agent.settings import Settings
from agent.tools_client import ToolsClient


Intent = Literal["USER_QUERY", "USER_STATUS", "MERCHANT", "MEDICINE", "ORDER", "OTHER"]


class Candidate(TypedDict, total=False):
    type: str
    userId: int
    username: str
    nickname: str
    mobile: str
    status: int
    createTime: str
    merchantId: int
    shopName: str
    contactName: str
    contactPhone: str
    auditStatus: int
    materialsComplete: bool
    missingMaterials: list[str]
    medicineId: int
    name: str
    stock: int
    price: str
    status: int
    orderId: int
    orderNo: str
    totalAmount: str
    payAmount: str
    userId: int
    sellerId: int
    aftersalesId: int
    refundStatus: int
    refundType: int
    refundAmount: str


class GraphState(TypedDict, total=False):
    message: str
    token: str
    request_id: Optional[str]
    intent: Intent
    pending_action: str | None
    candidates: list[Candidate]
    admin_user_status_draft: dict[str, Any] | None
    admin_merchant_audit_draft: dict[str, Any] | None
    admin_merchant_last_id: int | None
    admin_medicine_last_id: int | None
    admin_medicine_status_draft: dict[str, Any] | None
    admin_medicine_delete_draft: dict[str, Any] | None
    admin_order_last_id: int | None
    admin_aftersales_last_id: int | None
    admin_aftersales_audit_draft: dict[str, Any] | None
    reply: str
    cards: list[dict[str, Any]]


_MOBILE_RE = re.compile(r"(?<!\d)1\d{10}(?!\d)")


def build_admin_graph(settings: Settings):
    tools = ToolsClient(settings)

    def _fmt_kv(rows: list[list[Any]]) -> str:
        lines: list[str] = []
        for r in rows:
            if not r:
                continue
            k = str(r[0])
            v = "-" if len(r) < 2 or r[1] is None or str(r[1]).strip() == "" else str(r[1])
            lines.append(f"{k}：{v}")
        return "\n".join(lines) if lines else ""

    def _fmt_lines(title: str, lines: list[str]) -> str:
        body = "\n".join([ln for ln in lines if (ln or "").strip()])
        if not title:
            return body
        if not body:
            return title
        return f"{title}\n{body}"

    def is_confirm_text(text: str) -> bool:
        t = (text or "").strip().lower()
        return t in {"1", "确认", "是", "好的", "好", "可以", "ok", "okay"}

    def is_cancel_text(text: str) -> bool:
        t = (text or "").strip().lower()
        return t in {"0", "取消", "否", "不", "不要", "算了"}

    def _extract_pick_index(text: str) -> Optional[int]:
        m = re.match(r"^\s*(\d{1,2})\s*$", text or "")
        if not m:
            return None
        try:
            v = int(m.group(1))
        except ValueError:
            return None
        if v <= 0:
            return None
        return v

    def _extract_user_id(text: str) -> Optional[int]:
        t = text or ""
        m = re.search(r"(?:userId|userid|用户id|用户ID|id|ID)\s*[:=：]?\s*(\d{1,18})", t, flags=re.IGNORECASE)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                return None
        m2 = re.search(r"(?:禁用|启用|解禁|恢复)\s*(?:用户)?\s*(\d{1,18})\b", t)
        if m2:
            try:
                return int(m2.group(1))
            except ValueError:
                return None
        return None

    def _extract_merchant_id(text: str) -> Optional[int]:
        t = text or ""
        m = re.search(
            r"(?:merchantId|merchantid|商家id|商家ID|店铺id|店铺ID|id|ID)\s*[:=：]?\s*(\d{1,18})",
            t,
            flags=re.IGNORECASE,
        )
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                return None
        m2 = re.search(r"(?:通过|驳回|查看|展开)\s*(?:商家)?\s*(\d{1,18})\b", t)
        if m2:
            try:
                return int(m2.group(1))
            except ValueError:
                return None
        return None

    def _extract_mobile(text: str) -> Optional[str]:
        m = _MOBILE_RE.search(text or "")
        if not m:
            return None
        return m.group(0)

    def _extract_reason(text: str) -> Optional[str]:
        t = (text or "").strip()
        m = re.search(r"(?:原因|理由|备注)\s*[:：]\s*(.+)$", t)
        if not m:
            return None
        r = (m.group(1) or "").strip()
        if not r:
            return None
        return r[:200]

    def _extract_expand_field(text: str) -> Optional[str]:
        t = (text or "").strip()
        m = re.search(r"展开\s*(?:商家)?\s*(?:id[:=：]?\s*\d+\s*)?(.+)$", t)
        if not m:
            return None
        f = (m.group(1) or "").strip()
        if not f:
            return None
        return f

    def _classify_intent(text: str) -> Intent:
        t = text or ""
        if any(t.strip().startswith(k) for k in ["上架", "下架", "删除"]):
            return "MEDICINE"
        if any(k in t for k in ["订单列表", "查询订单", "搜索订单", "订单号", "订单明细", "订单详情"]):
            return "ORDER"
        if any(k in t for k in ["售后", "退款申请", "退款列表"]):
            return "ORDER"
        if any(k in t for k in ["待支付订单", "待发货订单", "已发货订单", "已完成订单", "售后订单", "退款订单", "已取消订单", "待审核订单"]):
            return "ORDER"
        if any(k in t for k in ["商品列表", "药品列表", "商品库", "药品库", "搜索商品", "搜索药品", "查药品", "查询药品"]):
            return "MEDICINE"
        if any(k in t for k in ["查用户", "查询用户", "搜索用户", "用户列表", "找用户"]):
            return "USER_QUERY"
        if any(k in t for k in ["禁用", "启用", "解禁", "恢复"]):
            return "USER_STATUS"
        if any(k in t for k in ["商家", "店铺", "入驻"]):
            return "MERCHANT"
        if any(k in t for k in ["待审核", "已通过", "已驳回"]) and any(k in t for k in ["列表", "查询", "搜索"]):
            return "MERCHANT"
        if any(t.strip().startswith(k) for k in ["查看", "通过", "驳回", "展开"]):
            return "MERCHANT"
        return "OTHER"

    def _status_from_text(text: str) -> Optional[int]:
        t = text or ""
        if any(k in t for k in ["禁用", "停用", "封禁"]):
            return 0
        if any(k in t for k in ["启用", "解禁", "恢复"]):
            return 1
        return None

    def _status_text(status: Any) -> str:
        try:
            v = int(status)
        except (TypeError, ValueError):
            return str(status)
        return "正常" if v == 1 else "禁用" if v == 0 else str(v)

    def _merchant_audit_status_text(status: Any) -> str:
        try:
            v = int(status)
        except (TypeError, ValueError):
            return str(status)
        if v == 0:
            return "待审核"
        if v == 1:
            return "已通过"
        if v == 2:
            return "已驳回"
        return str(v)

    def _resolve_merchant_id_from_index(state: GraphState, idx: int) -> Optional[int]:
        candidates = state.get("candidates") or []
        if idx <= 0 or idx > len(candidates):
            return None
        picked = candidates[idx - 1]
        if str(picked.get("type") or "") != "MERCHANT":
            return None
        try:
            return int(picked.get("merchantId"))
        except (TypeError, ValueError):
            return None

    def _extract_medicine_id(text: str) -> Optional[int]:
        t = text or ""
        m = re.search(
            r"(?:medicineId|medicineid|药品id|药品ID|商品id|商品ID|id|ID)\s*[:=：]?\s*(\d{1,18})",
            t,
            flags=re.IGNORECASE,
        )
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                return None
        m1 = re.search(r"(?:商品|药品)\s*[:=：]?\s*(\d{1,18})\b", t)
        if m1:
            try:
                return int(m1.group(1))
            except ValueError:
                return None
        m2 = re.search(r"(?:查看)\s*(\d{1,18})\b", t)
        if m2:
            try:
                return int(m2.group(1))
            except ValueError:
                return None
        return None

    def _resolve_medicine_id_from_index(state: GraphState, idx: int) -> Optional[int]:
        candidates = state.get("candidates") or []
        if idx <= 0 or idx > len(candidates):
            return None
        picked = candidates[idx - 1]
        if str(picked.get("type") or "") != "MEDICINE":
            return None
        try:
            return int(picked.get("medicineId"))
        except (TypeError, ValueError):
            return None

    def _extract_order_id(text: str) -> Optional[int]:
        t = text or ""
        m = re.search(r"(?:订单id|订单ID|orderId|orderid|id|ID)\s*[:=：]?\s*(\d{1,18})", t, flags=re.IGNORECASE)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                return None
        m1 = re.search(r"(?:订单)\s*[:=：]?\s*(\d{1,18})\b", t)
        if m1:
            try:
                return int(m1.group(1))
            except ValueError:
                return None
        m2 = re.search(r"(?:查看)\s*(\d{1,18})\b", t)
        if m2:
            try:
                return int(m2.group(1))
            except ValueError:
                return None
        return None

    def _resolve_order_id_from_index(state: GraphState, idx: int) -> Optional[int]:
        candidates = state.get("candidates") or []
        if idx <= 0 or idx > len(candidates):
            return None
        picked = candidates[idx - 1]
        if str(picked.get("type") or "") != "ORDER":
            return None
        try:
            return int(picked.get("orderId"))
        except (TypeError, ValueError):
            return None

    def _order_status_text(value: Any) -> str:
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        mapping = {
            -1: "已取消",
            0: "待支付",
            1: "待发货",
            2: "已发货",
            3: "已完成",
            4: "售后中",
            5: "已退款",
            7: "待审核",
        }
        return mapping.get(v, str(v))

    def _order_status_from_text(text: str) -> Optional[int]:
        t = text or ""
        if any(k in t for k in ["已取消", "取消订单"]):
            return -1
        if any(k in t for k in ["待支付"]):
            return 0
        if any(k in t for k in ["待发货", "待处理"]):
            return 1
        if any(k in t for k in ["已发货"]):
            return 2
        if any(k in t for k in ["已完成", "完成订单"]):
            return 3
        if any(k in t for k in ["售后", "退款中"]):
            return 4
        if any(k in t for k in ["已退款"]):
            return 5
        if any(k in t for k in ["待审核", "处方审核"]):
            return 7
        return None

    def _refund_status_text(value: Any) -> str:
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        if v == 0:
            return "待审核"
        if v == 1:
            return "已通过"
        if v == 2:
            return "已拒绝"
        return str(v)

    def _refund_type_text(value: Any) -> str:
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        if v == 1:
            return "仅退款"
        if v == 2:
            return "退货退款"
        return str(v)

    def _extract_aftersales_id(text: str) -> Optional[int]:
        t = text or ""
        m = re.search(r"(?:售后id|售后ID|aftersalesId|refundId|id|ID)\s*[:=：]?\s*(\d{1,18})", t, flags=re.IGNORECASE)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                return None
        m1 = re.search(r"(?:售后|退款)\s*[:=：]?\s*(\d{1,18})\b", t)
        if m1:
            try:
                return int(m1.group(1))
            except ValueError:
                return None
        return None

    def _resolve_aftersales_id_from_index(state: GraphState, idx: int) -> Optional[int]:
        candidates = state.get("candidates") or []
        if idx <= 0 or idx > len(candidates):
            return None
        picked = candidates[idx - 1]
        if str(picked.get("type") or "") != "AFTERSALES":
            return None
        try:
            return int(picked.get("aftersalesId"))
        except (TypeError, ValueError):
            return None

    def order_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查询订单。", "cards": []}

        message = (state.get("message") or "").strip()

        if state.get("pending_action") == "ADMIN_AFTERSALES_AUDIT_CONFIRM":
            user_text = state.get("message") or ""
            draft = state.get("admin_aftersales_audit_draft") or {}
            if not isinstance(draft, dict) or not draft:
                return {
                    "pending_action": None,
                    "admin_aftersales_audit_draft": None,
                    "reply": "操作信息已失效，请重新发起。",
                    "cards": [],
                }
            if is_cancel_text(user_text):
                return {"pending_action": None, "admin_aftersales_audit_draft": None, "reply": "已取消操作。", "cards": []}
            if not is_confirm_text(user_text):
                return {"pending_action": "ADMIN_AFTERSALES_AUDIT_CONFIRM", "reply": "请回复 1 确认执行，或回复 0 取消。", "cards": []}

            try:
                apply_id = int(draft.get("applyId"))
            except (TypeError, ValueError):
                return {"pending_action": None, "admin_aftersales_audit_draft": None, "reply": "售后ID无效，请重新发起。", "cards": []}
            pass_ = bool(draft.get("pass"))
            audit_reason = draft.get("auditReason")
            if isinstance(audit_reason, str):
                audit_reason = audit_reason.strip()[:255] or None
            else:
                audit_reason = None

            payload = tools.admin_aftersales_audit(token, apply_id=apply_id, pass_=pass_, audit_reason=audit_reason, request_id=request_id)
            if not payload.get("success", True):
                err = payload.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"pending_action": None, "admin_aftersales_audit_draft": None, "reply": f"执行失败：{err.strip()}", "cards": []}
                return {"pending_action": None, "admin_aftersales_audit_draft": None, "reply": "执行失败，请稍后再试。", "cards": []}

            rows = [["售后ID", apply_id], ["结果", "已同意" if pass_ else "已拒绝"], ["原因", audit_reason or "-"]]
            return {
                "pending_action": None,
                "admin_aftersales_audit_draft": None,
                "admin_aftersales_last_id": apply_id,
                "reply": _fmt_lines("【执行结果】", [_fmt_kv(rows)]),
                "cards": [],
            }

        if any(k in message for k in ["售后订单", "售后列表", "退款列表", "退款申请", "售后申请"]):
            status_filter = None
            if any(k in message for k in ["待审核", "未审核"]):
                status_filter = 0
            elif any(k in message for k in ["已通过", "通过"]):
                status_filter = 1
            elif any(k in message for k in ["已拒绝", "拒绝"]):
                status_filter = 2
            if any(k in message for k in ["全部", "所有"]):
                status_filter = None
            if status_filter is None:
                status_filter = 0

            payload = tools.admin_aftersales_list(token, status=status_filter, page=1, size=10, request_id=request_id)
            if not payload.get("success", True):
                err = payload.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"查询售后失败：{err.strip()}", "cards": []}
                return {"reply": "查询售后失败，请稍后再试。", "cards": []}
            data = payload.get("data") or {}
            records = data.get("records") or []
            total = data.get("total") or 0
            if not isinstance(records, list) or not records:
                return {"reply": "暂无售后申请。", "cards": []}

            candidates: list[Candidate] = []
            lines = [f"共 {int(total)} 条售后申请（{_refund_status_text(status_filter)}，展示前 10 条）："]
            for i, r in enumerate(records[:10], start=1):
                if not isinstance(r, dict):
                    continue
                aid = r.get("id")
                oid = r.get("orderId")
                ono = r.get("orderNo") or "-"
                uid = r.get("userId")
                uname = r.get("username") or "-"
                t = _refund_type_text(r.get("type"))
                amt = r.get("amount")
                st = _refund_status_text(r.get("status"))
                ct = r.get("createTime") or "-"
                candidates.append(
                    {
                        "type": "AFTERSALES",
                        "aftersalesId": int(aid or 0),
                        "orderId": int(oid or 0),
                        "orderNo": str(ono),
                        "userId": int(uid or 0),
                        "refundType": int(r.get("type") or 0),
                        "refundStatus": int(r.get("status") or 0),
                        "refundAmount": str(amt) if amt is not None else "0.00",
                    }
                )
                lines.append(f"{i}. 售后ID={aid} 订单ID={oid} 订单号={ono} 用户={uname} 类型={t} 金额={amt} 状态={st} 申请时间={ct}")
            lines.append("可输入：查看 1")
            lines.append("可输入：同意售后 1 / 拒绝售后 1 原因：xxx")
            return {"candidates": candidates, "reply": "\n".join(lines), "cards": []}

        if message.startswith("查看") and any((c or {}).get("type") == "AFTERSALES" for c in (state.get("candidates") or [])):
            raw = re.sub(r"^查看\s*", "", message).strip()
            idx = _extract_pick_index(raw)
            apply_id = _extract_aftersales_id(message)
            if apply_id is None and idx is not None:
                apply_id = _resolve_aftersales_id_from_index(state, idx)
                if apply_id is None:
                    candidates = state.get("candidates") or []
                    if idx > len(candidates):
                        apply_id = idx
            if apply_id is None:
                apply_id = state.get("admin_aftersales_last_id")
            if apply_id is None:
                return {"reply": "请提供售后ID或列表序号，例如：查看 1 或 查看 售后id=3。", "cards": []}

            detail = tools.admin_aftersales_detail(token, apply_id=apply_id, request_id=request_id)
            if not detail.get("success", True):
                err = detail.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"查询售后失败：{err.strip()}", "cards": []}
                return {"reply": "查询售后失败，请稍后再试。", "cards": []}
            data = detail.get("data") or {}
            if not isinstance(data, dict) or not data:
                return {"reply": "未找到该售后申请。", "cards": []}
            rows = [
                ["售后ID", data.get("id")],
                ["订单ID", data.get("orderId")],
                ["订单号", data.get("orderNo")],
                ["用户ID", data.get("userId")],
                ["用户", data.get("username") or "-"],
                ["类型", _refund_type_text(data.get("type"))],
                ["金额", data.get("amount")],
                ["原因", data.get("reason")],
                ["状态", _refund_status_text(data.get("status"))],
                ["申请时间", data.get("createTime")],
                ["原订单状态", _order_status_text(data.get("originalOrderStatus"))],
                ["审核时间", data.get("auditTime")],
                ["审核备注", data.get("auditReason")],
                ["凭证", data.get("images")],
            ]
            return {
                "admin_aftersales_last_id": int(data.get("id") or apply_id),
                "reply": _fmt_lines("【售后详情】", [_fmt_kv(rows), "", "可输入：同意售后 1 / 拒绝售后 1 原因：xxx"]),
                "cards": [],
            }

        if message.startswith("同意售后") or message.startswith("拒绝售后"):
            pass_ = message.startswith("同意售后")
            raw = re.sub(r"^(同意售后|拒绝售后)\s*", "", message).strip()
            audit_reason = None
            if not pass_:
                m = re.search(r"原因[:：]\s*(.+)$", raw)
                if m:
                    audit_reason = (m.group(1) or "").strip()[:255] or None
                    raw = re.sub(r"原因[:：]\s*.+$", "", raw).strip()
            idx = _extract_pick_index(raw)
            apply_id = _extract_aftersales_id(raw)
            if apply_id is None and idx is not None:
                apply_id = _resolve_aftersales_id_from_index(state, idx)
                if apply_id is None:
                    candidates = state.get("candidates") or []
                    if idx > len(candidates):
                        apply_id = idx
            if apply_id is None:
                apply_id = state.get("admin_aftersales_last_id")
            if apply_id is None:
                return {"reply": "请提供售后ID或列表序号，例如：同意售后 1 或 拒绝售后 售后id=3 原因：xxx。", "cards": []}
            if not pass_ and not audit_reason:
                return {"reply": "拒绝售后必须提供原因，例如：拒绝售后 1 原因：不符合售后条件。", "cards": []}

            preview = tools.admin_preview_aftersales_audit(
                token,
                apply_id=apply_id,
                pass_=pass_,
                audit_reason=audit_reason,
                request_id=request_id,
            )
            if not preview.get("success", True):
                err = preview.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"预检查失败：{err.strip()}", "cards": []}
                return {"reply": "预检查失败，请稍后再试。", "cards": []}
            pdata = preview.get("data") or {}
            if not isinstance(pdata, dict) or not pdata:
                return {"reply": "预检查失败：数据异常。", "cards": []}
            if not pdata.get("allowed", True):
                return {"reply": f"无法执行：{pdata.get('notAllowedReason') or '不允许操作'}。", "cards": []}

            draft = {"applyId": apply_id, "pass": pass_, "auditReason": audit_reason}
            action_text = "同意" if pass_ else "拒绝"
            order_no = pdata.get("orderNo") or "-"
            amt = pdata.get("amount")
            t = _refund_type_text(pdata.get("type"))
            r = pdata.get("applyReason") or "-"
            return {
                "pending_action": "ADMIN_AFTERSALES_AUDIT_CONFIRM",
                "admin_aftersales_audit_draft": draft,
                "admin_aftersales_last_id": apply_id,
                "reply": "\n".join(
                    [
                        "【预览】",
                        f"售后ID={apply_id} 订单号={order_no}",
                        f"类型：{t} 退款金额：{amt}",
                        f"申请原因：{r}",
                        f"操作：{action_text}售后",
                        f"备注：{audit_reason or '-'}",
                        "请回复 1 确认执行，或回复 0 取消。",
                    ]
                ),
                "cards": [],
            }

        if message.startswith("查看") or any(k in message for k in ["订单详情", "订单明细"]):
            raw = re.sub(r"^(查看|订单详情|订单明细)\s*", "", message).strip()
            idx = _extract_pick_index(raw)
            order_id = _extract_order_id(message)
            if order_id is None and idx is not None:
                order_id = _resolve_order_id_from_index(state, idx)
            if order_id is None:
                order_id = state.get("admin_order_last_id")
            if order_id is None:
                return {"reply": "请提供订单ID或列表序号，例如：查看 1 或 查看 订单id=123。", "cards": []}

            detail = tools.admin_order_detail(token, order_id=order_id, request_id=request_id)
            if not detail.get("success", True):
                err = detail.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"查询订单失败：{err.strip()}", "cards": []}
                return {"reply": "查询订单失败，请稍后再试。", "cards": []}
            data = detail.get("data") or {}
            if not isinstance(data, dict) or not data:
                return {"reply": "未找到该订单。", "cards": []}

            rows = [
                ["订单ID", data.get("id")],
                ["订单号", data.get("orderNo")],
                ["状态", _order_status_text(data.get("status"))],
                ["总金额", data.get("totalAmount")],
                ["实付金额", data.get("payAmount")],
                ["用户ID", data.get("userId")],
                ["商家ID", data.get("sellerId")],
                ["创建时间", data.get("createTime")],
                ["收货人", data.get("receiverName")],
                ["收货电话", data.get("receiverPhone")],
                ["收货地址", data.get("receiverAddress")],
            ]
            if data.get("auditStatus") is not None:
                rows.append(["处方审核", data.get("auditStatus")])
            if data.get("auditReason"):
                rows.append(["审核原因", data.get("auditReason")])
            return {
                "admin_order_last_id": int(data.get("id") or order_id),
                "reply": _fmt_lines("【订单详情】", [_fmt_kv(rows)]),
                "cards": [],
            }

        status = _order_status_from_text(message)
        if status is None and any(k in message for k in ["订单列表", "订单"]):
            status = None

        payload = tools.admin_orders_list(token, status=status, page=1, size=10, request_id=request_id)
        if not payload.get("success", True):
            err = payload.get("error") or ""
            if isinstance(err, str) and err.strip():
                return {"reply": f"查询订单失败：{err.strip()}", "cards": []}
            return {"reply": "查询订单失败，请稍后再试。", "cards": []}
        data = payload.get("data") or {}
        records = data.get("records") or []
        total = data.get("total") or 0
        if not isinstance(records, list) or not records:
            if status is None:
                return {"reply": "暂无订单。", "cards": []}
            return {"reply": f"暂无{_order_status_text(status)}订单。", "cards": []}

        candidates: list[Candidate] = []
        title_status = "全部" if status is None else _order_status_text(status)
        lines = [f"共 {int(total)} 条订单（{title_status}，展示前 10 条）："]
        for i, r in enumerate(records[:10], start=1):
            if not isinstance(r, dict):
                continue
            oid = r.get("id")
            ono = r.get("orderNo") or "-"
            st = _order_status_text(r.get("status"))
            pay = r.get("payAmount")
            total_amt = r.get("totalAmount")
            ct = r.get("createTime") or "-"
            uid = r.get("userId")
            sid = r.get("sellerId")
            candidates.append({"type": "ORDER", "orderId": int(oid or 0), "orderNo": str(ono)})
            lines.append(f"{i}. 订单ID={oid} 订单号={ono} 状态={st} 总额={total_amt} 实付={pay} 用户={uid} 商家={sid} 时间={ct}")
        lines.append("可输入：查看 1")
        lines.append("可输入：待支付订单 / 待发货订单 / 已发货订单 / 已完成订单 / 售后订单 / 已退款订单 / 已取消订单 / 待审核订单")
        return {"candidates": candidates, "reply": "\n".join(lines), "cards": []}

    def _medicine_status_text(value: Any) -> str:
        try:
            v = int(value)
        except (TypeError, ValueError):
            return str(value)
        return "上架" if v == 1 else "下架" if v == 0 else str(v)

    def _build_reject_remark(missing: list[str], extra_reason: Optional[str] = None) -> str:
        missing_text = "、".join([m for m in missing if m]) if missing else ""
        base = "材料不完整，暂不支持通过。"
        if missing_text:
            base += f"缺失：{missing_text}。"
        if extra_reason:
            extra_reason = extra_reason.strip()
            if extra_reason:
                base += f"{extra_reason}。"
        v1 = base + "规范：图片清晰完整、信息可读、无反光遮挡；信息需与证件一致。请补齐后重新提交入驻申请再审。"
        if len(v1) <= 200:
            return v1
        v2 = base + "规范：清晰完整、信息一致。请补齐后重新提交再审。"
        if len(v2) <= 200:
            return v2
        v3 = base + "请补齐后重新提交入驻申请再审。"
        if len(v3) <= 200:
            return v3
        return v3[:200]

    def normalize_input(state: GraphState) -> dict[str, Any]:
        message = state.get("message") or ""
        pending_action = state.get("pending_action")
        updates: dict[str, Any] = {"message": message}
        if pending_action in {"ADMIN_USER_PICK", "ADMIN_USER_STATUS_CONFIRM"}:
            updates["intent"] = "USER_STATUS"
            return updates
        if pending_action in {"ADMIN_MERCHANT_AUDIT_CONFIRM"}:
            updates["intent"] = "MERCHANT"
            return updates
        if pending_action in {"ADMIN_MEDICINE_STATUS_CONFIRM", "ADMIN_MEDICINE_DELETE_CONFIRM"}:
            updates["intent"] = "MEDICINE"
            return updates
        if pending_action in {"ADMIN_AFTERSALES_AUDIT_CONFIRM"}:
            updates["intent"] = "ORDER"
            return updates
        detected = _classify_intent(message)
        if detected == "MERCHANT" and any((c or {}).get("type") == "AFTERSALES" for c in (state.get("candidates") or [])):
            if (message or "").strip().startswith("查看"):
                updates["intent"] = "ORDER"
                return updates
        if detected == "MERCHANT" and any((c or {}).get("type") == "ORDER" for c in (state.get("candidates") or [])):
            if (message or "").strip().startswith("查看"):
                updates["intent"] = "ORDER"
                return updates
        if detected == "MERCHANT" and any((c or {}).get("type") == "MEDICINE" for c in (state.get("candidates") or [])):
            if (message or "").strip().startswith("查看"):
                updates["intent"] = "MEDICINE"
                return updates
        if detected == "MERCHANT":
            if any((c or {}).get("type") == "MERCHANT" for c in (state.get("candidates") or [])):
                updates["intent"] = "MERCHANT"
            else:
                updates["intent"] = "MERCHANT"
            return updates
        updates["intent"] = detected
        return updates

    def handle_pending_pick(state: GraphState) -> dict[str, Any]:
        if state.get("pending_action") != "ADMIN_USER_PICK":
            return {}
        idx = _extract_pick_index(state.get("message") or "")
        if idx is None:
            return {}
        candidates = state.get("candidates") or []
        if idx > len(candidates):
            return {}
        picked = candidates[idx - 1]
        try:
            user_id = int(picked.get("userId"))
        except (TypeError, ValueError):
            return {}
        draft = state.get("admin_user_status_draft") or {}
        if not isinstance(draft, dict):
            draft = {}
        draft["userId"] = user_id
        draft["pickedUser"] = picked
        return {"admin_user_status_draft": draft, "pending_action": None, "candidates": []}

    def query_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查询用户。", "cards": []}

        keyword = (state.get("message") or "").strip()
        keyword = re.sub(r"^(查用户|查询用户|搜索用户|找用户)\s*", "", keyword)
        keyword = keyword.strip()
        if not keyword:
            keyword = None

        payload = tools.admin_users_list(token, keyword=keyword, page=1, size=10, request_id=request_id)
        if not payload.get("success", True):
            return {"reply": "工具服务暂时不可用，请稍后再试。", "cards": []}
        data = payload.get("data") or {}
        records = data.get("records") or []
        total = data.get("total") or 0
        if not isinstance(records, list) or not records:
            return {"reply": "没有找到匹配的普通用户。", "cards": []}

        lines = [f"为你找到 {int(total)} 个普通用户（展示前 10 条）："]
        for i, u in enumerate(records[:10], start=1):
            if not isinstance(u, dict):
                continue
            lines.append(
                f"{i}. id={u.get('id')} 账号={u.get('username') or '-'} 昵称={u.get('nickname') or '-'} 手机={u.get('mobile') or '-'} 状态={_status_text(u.get('status'))}"
            )
        lines.append("你可以发：禁用用户 id=xxx 原因：xxx，或 启用用户 id=xxx 原因：xxx")
        return {"reply": "\n".join(lines), "cards": []}

    def status_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法修改用户状态。", "cards": []}

        if state.get("pending_action") == "ADMIN_USER_STATUS_CONFIRM":
            user_text = state.get("message") or ""
            draft = state.get("admin_user_status_draft") or {}
            if not isinstance(draft, dict) or not draft:
                return {"pending_action": None, "admin_user_status_draft": None, "reply": "操作信息已失效，请重新发起。"}
            if is_cancel_text(user_text):
                return {"pending_action": None, "admin_user_status_draft": None, "reply": "已取消操作。"}
            if not is_confirm_text(user_text):
                return {"pending_action": "ADMIN_USER_STATUS_CONFIRM", "reply": "请回复 1 确认执行，或回复 0 取消。"}

            try:
                user_id = int(draft.get("userId"))
            except (TypeError, ValueError):
                return {"pending_action": None, "admin_user_status_draft": None, "reply": "用户ID无效，请重新发起。"}
            try:
                to_status = int(draft.get("toStatus"))
            except (TypeError, ValueError):
                return {"pending_action": None, "admin_user_status_draft": None, "reply": "目标状态无效，请重新发起。"}
            reason = draft.get("reason")
            if isinstance(reason, str):
                reason = reason.strip()[:200]
            else:
                reason = None

            payload = tools.admin_set_user_status(token, user_id=user_id, status=to_status, reason=reason, request_id=request_id)
            if not payload.get("success", True):
                err = payload.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"pending_action": None, "admin_user_status_draft": None, "reply": f"执行失败：{err.strip()}"}
                return {"pending_action": None, "admin_user_status_draft": None, "reply": "执行失败，请稍后再试。"}

            picked = draft.get("pickedUser") if isinstance(draft.get("pickedUser"), dict) else {}
            label = picked.get("username") or picked.get("nickname") or f"id={user_id}"
            return {
                "pending_action": None,
                "admin_user_status_draft": None,
                "reply": f"已执行：{label} 状态已设置为 {_status_text(to_status)}。",
                "cards": [],
            }

        message = state.get("message") or ""
        to_status = _status_from_text(message)
        if to_status is None:
            return {"reply": "请说明要“启用”还是“禁用”该用户。", "cards": []}

        reason = _extract_reason(message)
        user_id = _extract_user_id(message)
        mobile = _extract_mobile(message)

        draft: dict[str, Any] = {"toStatus": to_status}
        if reason:
            draft["reason"] = reason

        if user_id is not None:
            detail = tools.admin_user_detail(token, user_id=user_id, request_id=request_id)
            if not detail.get("success", True):
                err = detail.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"查询用户失败：{err.strip()}", "cards": []}
                return {"reply": "查询用户失败，请稍后再试。", "cards": []}
            user_data = detail.get("data") or {}
            if not isinstance(user_data, dict) or not user_data:
                return {"reply": "未找到该用户。", "cards": []}
            draft["userId"] = int(user_data.get("id") or user_id)
            draft["pickedUser"] = {
                "userId": draft["userId"],
                "username": user_data.get("username") or "",
                "nickname": user_data.get("nickname") or "",
                "mobile": user_data.get("mobile") or "",
                "status": user_data.get("status"),
            }
            current_status = user_data.get("status")
            if str(current_status) == str(to_status):
                label = user_data.get("username") or user_data.get("nickname") or f"id={draft['userId']}"
                return {"reply": f"无需执行：{label} 当前状态已是 {_status_text(to_status)}。", "cards": []}
            label = user_data.get("username") or user_data.get("nickname") or f"id={draft['userId']}"
            reason_text = f"；原因：{reason}" if reason else ""
            return {
                "pending_action": "ADMIN_USER_STATUS_CONFIRM",
                "admin_user_status_draft": draft,
                "reply": f"即将把 {label} 设置为 {_status_text(to_status)}{reason_text}。请回复 1 确认执行，或回复 0 取消。",
                "cards": [],
            }

        keyword = None
        if mobile:
            keyword = mobile
        else:
            keyword = re.sub(r"^(禁用|启用|解禁|恢复)\s*(用户)?", "", message).strip()
            keyword = re.sub(r"(原因|理由|备注)\s*[:：].*$", "", keyword).strip()
            keyword = keyword or None

        if not keyword:
            return {"reply": "请提供用户ID或手机号或用户名/昵称关键词。", "cards": []}

        users_payload = tools.admin_users_list(token, keyword=keyword, page=1, size=10, request_id=request_id)
        if not users_payload.get("success", True):
            return {"reply": "工具服务暂时不可用，请稍后再试。", "cards": []}
        data = users_payload.get("data") or {}
        records = data.get("records") or []
        if not isinstance(records, list) or not records:
            return {"reply": "没有找到匹配的普通用户。", "cards": []}

        candidates: list[UserCandidate] = []
        for row in records[:10]:
            if not isinstance(row, dict):
                continue
            try:
                uid = int(row.get("id"))
            except (TypeError, ValueError):
                continue
            candidates.append(
                {
                    "userId": uid,
                    "username": str(row.get("username") or ""),
                    "nickname": str(row.get("nickname") or ""),
                    "mobile": str(row.get("mobile") or ""),
                    "status": row.get("status"),
                    "createTime": str(row.get("createTime") or ""),
                }
            )

        if len(candidates) == 1:
            picked = candidates[0]
            draft["userId"] = int(picked.get("userId"))
            draft["pickedUser"] = picked
            if str(picked.get("status")) == str(to_status):
                label = picked.get("username") or picked.get("nickname") or f"id={draft['userId']}"
                return {"reply": f"无需执行：{label} 当前状态已是 {_status_text(to_status)}。", "cards": []}
            label = picked.get("username") or picked.get("nickname") or f"id={draft['userId']}"
            reason_text = f"；原因：{reason}" if reason else ""
            return {
                "pending_action": "ADMIN_USER_STATUS_CONFIRM",
                "admin_user_status_draft": draft,
                "reply": f"即将把 {label} 设置为 {_status_text(to_status)}{reason_text}。请回复 1 确认执行，或回复 0 取消。",
                "cards": [],
            }

        lines = ["匹配到多个用户，请输入序号选择："]
        for i, u in enumerate(candidates, start=1):
            label = u.get("username") or u.get("nickname") or ""
            lines.append(
                f"{i}. id={u.get('userId')} 账号={label or '-'} 手机={u.get('mobile') or '-'} 状态={_status_text(u.get('status'))}"
            )
        return {
            "pending_action": "ADMIN_USER_PICK",
            "admin_user_status_draft": draft,
            "candidates": candidates,
            "reply": "\n".join(lines),
            "cards": [],
        }

    def merchant_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法进行商家审核。", "cards": []}

        if state.get("pending_action") == "ADMIN_MERCHANT_AUDIT_CONFIRM":
            user_text = state.get("message") or ""
            draft = state.get("admin_merchant_audit_draft") or {}
            if not isinstance(draft, dict) or not draft:
                return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": "操作信息已失效，请重新发起。", "cards": []}
            if is_cancel_text(user_text):
                return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": "已取消操作。", "cards": []}
            if not is_confirm_text(user_text):
                return {"pending_action": "ADMIN_MERCHANT_AUDIT_CONFIRM", "reply": "请回复 1 确认执行，或回复 0 取消。", "cards": []}

            try:
                merchant_id = int(draft.get("merchantId"))
            except (TypeError, ValueError):
                return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": "商家ID无效，请重新发起。", "cards": []}
            try:
                audit_status = int(draft.get("auditStatus"))
            except (TypeError, ValueError):
                return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": "审核状态无效，请重新发起。", "cards": []}
            audit_remark = draft.get("auditRemark")
            if isinstance(audit_remark, str):
                audit_remark = audit_remark.strip()[:200] or None
            else:
                audit_remark = None

            payload = tools.admin_audit_merchant(token, merchant_id=merchant_id, audit_status=audit_status, audit_remark=audit_remark, request_id=request_id)
            if not payload.get("success", True):
                err = payload.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": f"执行失败：{err.strip()}", "cards": []}
                return {"pending_action": None, "admin_merchant_audit_draft": None, "reply": "执行失败，请稍后再试。", "cards": []}

            rows = [
                ["商家ID", merchant_id],
                ["结果", "已通过" if audit_status == 1 else "已驳回"],
                ["audit_status", audit_status],
                ["audit_remark", audit_remark or "-"],
            ]
            return {
                "pending_action": None,
                "admin_merchant_audit_draft": None,
                "reply": _fmt_lines("【执行结果】", [_fmt_kv(rows)]),
                "cards": [],
            }

        message = (state.get("message") or "").strip()

        if message.startswith("展开"):
            field = _extract_expand_field(message)
            merchant_id = _extract_merchant_id(message)
            if merchant_id is None:
                idx = _extract_pick_index(re.sub(r"^展开\s*", "", message))
                if idx is not None:
                    merchant_id = _resolve_merchant_id_from_index(state, idx)
            if merchant_id is None:
                merchant_id = state.get("admin_merchant_last_id")
            if merchant_id is None or not field:
                return {"reply": "请输入要展开的商家ID/序号与字段，例如：展开 12 手机号。", "cards": []}

            mapping = {
                "手机号": "contactPhone",
                "电话": "contactPhone",
                "联系电话": "contactPhone",
                "信用代码": "creditCode",
                "统一社会信用代码": "creditCode",
                "营业执照": "licenseUrl",
                "执照": "licenseUrl",
                "身份证正面": "idCardFront",
                "身份证反面": "idCardBack",
                "身份证背面": "idCardBack",
            }
            key = mapping.get(field.strip())
            if not key:
                return {"reply": "仅支持展开：手机号/信用代码/营业执照/身份证正面/身份证背面。", "cards": []}

            detail = tools.admin_merchant_detail(token, merchant_id=merchant_id, reveal_fields=[key], request_id=request_id)
            if not detail.get("success", True):
                err = detail.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"查询商家失败：{err.strip()}", "cards": []}
                return {"reply": "查询商家失败，请稍后再试。", "cards": []}
            data = detail.get("data") or {}
            if not isinstance(data, dict):
                return {"reply": "商家数据异常。", "cards": []}

            value = None
            if key == "licenseUrl":
                value = ((data.get("materials") or {}).get("license") or {}).get("url")
            elif key == "idCardFront":
                value = ((data.get("materials") or {}).get("idCardFront") or {}).get("url")
            elif key == "idCardBack":
                value = ((data.get("materials") or {}).get("idCardBack") or {}).get("url")
            else:
                value = data.get(key)
            return {
                "admin_merchant_last_id": merchant_id,
                "reply": _fmt_lines("【展开字段】", [f"{field.strip()}：{value or '-'}"]),
                "cards": [],
            }

        if message.startswith("查看") or "商家详情" in message:
            idx = None
            m_idx = re.match(r"^\s*查看\s*(\d{1,2})\s*$", message)
            if m_idx:
                try:
                    idx = int(m_idx.group(1))
                except ValueError:
                    idx = None
            merchant_id = _extract_merchant_id(message)
            if merchant_id is None and idx is not None:
                merchant_id = _resolve_merchant_id_from_index(state, idx)
            if merchant_id is None:
                merchant_id = state.get("admin_merchant_last_id")
            if merchant_id is None:
                return {"reply": "请提供商家ID或列表序号，例如：查看 1 或 查看 商家id=12。", "cards": []}

            detail = tools.admin_merchant_detail(token, merchant_id=merchant_id, request_id=request_id)
            if not detail.get("success", True):
                err = detail.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"查询商家失败：{err.strip()}", "cards": []}
                return {"reply": "查询商家失败，请稍后再试。", "cards": []}
            data = detail.get("data") or {}
            if not isinstance(data, dict) or not data:
                return {"reply": "未找到该商家。", "cards": []}

            base_rows = [
                ["商家ID", data.get("id")],
                ["关联用户ID", data.get("userId")],
                ["店铺名称", data.get("shopName") or "-"],
                ["店铺地址", data.get("address") or "-"],
                ["联系人", data.get("contactName") or "-"],
                ["联系电话(脱敏)", data.get("contactPhone") or "-"],
                ["统一社会信用代码(脱敏)", data.get("creditCode") or "-"],
                ["审核状态", _merchant_audit_status_text(data.get("auditStatus"))],
                ["审核备注", data.get("auditRemark") or "-"],
                ["申请时间", data.get("createTime") or "-"],
            ]
            materials = data.get("materials") or {}
            license_present = bool((materials.get("license") or {}).get("present"))
            front_present = bool((materials.get("idCardFront") or {}).get("present"))
            back_present = bool((materials.get("idCardBack") or {}).get("present"))
            license_url = (materials.get("license") or {}).get("url")
            front_url = (materials.get("idCardFront") or {}).get("url")
            back_url = (materials.get("idCardBack") or {}).get("url")
            materials_rows = [
                ["营业执照", "✅" if license_present else "❌", license_url if license_present else "缺失"],
                ["身份证正面", "✅" if front_present else "❌", front_url if front_present else "缺失"],
                ["身份证背面", "✅" if back_present else "❌", back_url if back_present else "缺失"],
            ]
            missing = data.get("missingMaterials") or []
            tips = []
            if missing:
                tips.append(f"材料缺失：{ '、'.join(missing) }（缺失不允许通过）")
                tips.append(f"可直接驳回：驳回 商家id={merchant_id} 原因：缺少{ '、'.join(missing) }")
            tips.append(f"可输入：通过 商家id={merchant_id} 或 驳回 商家id={merchant_id} 原因：xxx")

            return {
                "admin_merchant_last_id": merchant_id,
                "reply": "\n\n".join(
                    [
                        _fmt_lines("【基本信息】", [_fmt_kv(base_rows)]),
                        _fmt_lines(
                            "【材料清单】",
                            [
                                f"{row[0]}：{row[1]}（{row[2]}）" if len(row) >= 3 else str(row)
                                for row in materials_rows
                            ],
                        ),
                        _fmt_lines("【操作提示】", tips),
                    ]
                ),
                "cards": [],
            }

        if message.startswith("通过") or message.startswith("驳回"):
            is_approve = message.startswith("通过")
            is_reject = message.startswith("驳回")
            idx = None
            m_idx = re.match(r"^\s*(?:通过|驳回)\s*(\d{1,2})\s*", message)
            if m_idx:
                try:
                    idx = int(m_idx.group(1))
                except ValueError:
                    idx = None
            merchant_id = _extract_merchant_id(message)
            if merchant_id is None and idx is not None:
                merchant_id = _resolve_merchant_id_from_index(state, idx)
            if merchant_id is None:
                merchant_id = state.get("admin_merchant_last_id")
            if merchant_id is None:
                return {"reply": "请提供商家ID或列表序号，例如：通过 1 或 驳回 商家id=12 原因：xxx。", "cards": []}

            if is_approve:
                preview = tools.admin_preview_merchant_audit(token, merchant_id=merchant_id, audit_status=1, request_id=request_id)
                if not preview.get("success", True):
                    err = preview.get("error") or ""
                    if isinstance(err, str) and err.strip():
                        return {"reply": f"预览失败：{err.strip()}", "cards": []}
                    return {"reply": "预览失败，请稍后再试。", "cards": []}
                pdata = preview.get("data") or {}
                if not isinstance(pdata, dict):
                    return {"reply": "预览数据异常。", "cards": []}
                current = pdata.get("currentAuditStatus")
                if str(current) != "0":
                    return {"reply": f"无需执行：当前状态为 {_merchant_audit_status_text(current)}。", "cards": []}
                missing = pdata.get("missingMaterials") or []
                if missing:
                    rows = [
                        ["当前状态", "待审核(0)"],
                        ["目标操作", "审核通过(1)"],
                        ["是否允许通过", "否"],
                        ["缺失材料", "、".join(missing)],
                        ["建议动作", "驳回并要求补齐材料后再审"],
                    ]
                    remark = _build_reject_remark(missing)
                    suggestion = f"驳回 商家id={merchant_id} 原因：{remark}"
                    return {
                        "reply": "\n\n".join([_fmt_lines("【校验结果】", [_fmt_kv(rows)]), suggestion]),
                        "cards": [],
                    }
                rows = [
                    ["当前状态", "待审核(0)"],
                    ["目标操作", "审核通过(1)"],
                    ["是否允许通过", "是"],
                    ["备注", "-"],
                ]
                draft = {"merchantId": merchant_id, "auditStatus": 1, "auditRemark": None}
                return {
                    "pending_action": "ADMIN_MERCHANT_AUDIT_CONFIRM",
                    "admin_merchant_audit_draft": draft,
                    "admin_merchant_last_id": merchant_id,
                    "reply": "\n\n".join([_fmt_lines("【校验结果】", [_fmt_kv(rows)]), "请回复 1 确认执行 / 0 取消"]),
                    "cards": [],
                }

            if is_reject:
                reason = _extract_reason(message)
                detail = tools.admin_merchant_detail(token, merchant_id=merchant_id, request_id=request_id)
                if not detail.get("success", True):
                    err = detail.get("error") or ""
                    if isinstance(err, str) and err.strip():
                        return {"reply": f"查询商家失败：{err.strip()}", "cards": []}
                    return {"reply": "查询商家失败，请稍后再试。", "cards": []}
                mdata = detail.get("data") or {}
                if not isinstance(mdata, dict) or not mdata:
                    return {"reply": "未找到该商家。", "cards": []}
                current = mdata.get("auditStatus")
                if str(current) != "0":
                    return {"reply": f"无需执行：当前状态为 {_merchant_audit_status_text(current)}。", "cards": []}
                missing = mdata.get("missingMaterials") or []
                audit_remark = None
                if missing:
                    audit_remark = _build_reject_remark(missing, extra_reason=reason)
                else:
                    if not reason:
                        return {"reply": "请提供驳回原因，例如：驳回 商家id=12 原因：信息不一致。", "cards": []}
                    audit_remark = (f"审核未通过：{reason.strip()}。请按要求完善后重新提交入驻申请再审。")[:200]

                preview = tools.admin_preview_merchant_audit(
                    token,
                    merchant_id=merchant_id,
                    audit_status=2,
                    audit_remark=audit_remark,
                    request_id=request_id,
                )
                if not preview.get("success", True):
                    err = preview.get("error") or ""
                    if isinstance(err, str) and err.strip():
                        return {"reply": f"预览失败：{err.strip()}", "cards": []}
                    return {"reply": "预览失败，请稍后再试。", "cards": []}
                rows = [
                    ["当前状态", "待审核(0)"],
                    ["目标操作", "审核驳回(2)"],
                    ["驳回原因", audit_remark or "-"],
                    ["将写入字段", "audit_status=2, audit_remark=..."],
                ]
                draft = {"merchantId": merchant_id, "auditStatus": 2, "auditRemark": audit_remark}
                return {
                    "pending_action": "ADMIN_MERCHANT_AUDIT_CONFIRM",
                    "admin_merchant_audit_draft": draft,
                    "admin_merchant_last_id": merchant_id,
                    "reply": "\n\n".join([_fmt_lines("【校验结果】", [_fmt_kv(rows)]), "请回复 1 确认执行 / 0 取消"]),
                    "cards": [],
                }

        if any(k in message for k in ["待审核商家", "商家列表", "已驳回商家", "已通过商家", "搜索商家", "查商家", "查询商家"]):
            audit_status = None
            if "待审核" in message:
                audit_status = 0
            if "已通过" in message:
                audit_status = 1
            if "已驳回" in message:
                audit_status = 2
            keyword = message
            keyword = re.sub(r"^(待审核商家|已通过商家|已驳回商家|商家列表|查商家|查询商家|搜索商家)\s*", "", keyword)
            keyword = keyword.strip()
            if not keyword:
                keyword = None

            payload = tools.admin_merchants_list(token, keyword=keyword, audit_status=audit_status, page=1, size=10, request_id=request_id)
            if not payload.get("success", True):
                return {"reply": "工具服务暂时不可用，请稍后再试。", "cards": []}
            data = payload.get("data") or {}
            records = data.get("records") or []
            total = data.get("total") or 0
            if not isinstance(records, list) or not records:
                return {"reply": "没有找到匹配的商家记录。", "cards": []}

            candidates: list[Candidate] = []
            rows = []
            for i, r in enumerate(records[:10], start=1):
                if not isinstance(r, dict):
                    continue
                mid = r.get("id")
                missing = r.get("missingMaterials") or []
                complete = bool(r.get("materialsComplete"))
                candidates.append(
                    {
                        "type": "MERCHANT",
                        "merchantId": int(mid) if mid is not None else 0,
                        "shopName": str(r.get("shopName") or ""),
                        "contactName": str(r.get("contactName") or ""),
                        "contactPhone": str(r.get("contactPhone") or ""),
                        "auditStatus": r.get("auditStatus"),
                        "createTime": str(r.get("createTime") or ""),
                        "materialsComplete": complete,
                        "missingMaterials": missing if isinstance(missing, list) else [],
                    }
                )
                rows.append(
                    [
                        i,
                        mid,
                        r.get("shopName") or "-",
                        r.get("contactName") or "-",
                        r.get("contactPhone") or "-",
                        _merchant_audit_status_text(r.get("auditStatus")),
                        r.get("createTime") or "-",
                        "✅" if complete else ("❌ 缺：" + "、".join(missing) if missing else "❌"),
                    ]
                )
            lines = [f"共 {int(total)} 条记录（展示前 10 条）："]
            for r in rows:
                try:
                    idx = r[0]
                    mid = r[1]
                    shop = r[2]
                    contact = r[3]
                    phone = r[4]
                    st = r[5]
                    ct = r[6]
                    complete = r[7]
                except Exception:
                    continue
                lines.append(
                    f"{idx}. 商家ID={mid} 店铺={shop} 联系人={contact} 手机={phone} 状态={st} 申请时间={ct} 材料={complete}"
                )
            tips = "可输入：查看 1 / 通过 1 / 驳回 1 原因：xxx / 展开 1 手机号"
            return {"candidates": candidates, "reply": _fmt_lines("", lines + ["", tips]), "cards": []}

        return {"reply": "可用指令示例：\n- 待审核商家列表\n- 搜索商家 西安\n- 查看 1\n- 通过 1\n- 驳回 1 原因：材料不完整\n- 展开 1 营业执照", "cards": []}

    def medicine_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查询商品。", "cards": []}

        message = (state.get("message") or "").strip()
        if state.get("pending_action") == "ADMIN_MEDICINE_DELETE_CONFIRM":
            user_text = state.get("message") or ""
            draft = state.get("admin_medicine_delete_draft") or {}
            if not isinstance(draft, dict) or not draft:
                return {
                    "pending_action": None,
                    "admin_medicine_delete_draft": None,
                    "reply": "操作信息已失效，请重新发起。",
                    "cards": [],
                }
            if is_cancel_text(user_text):
                return {"pending_action": None, "admin_medicine_delete_draft": None, "reply": "已取消操作。", "cards": []}
            if not is_confirm_text(user_text):
                return {"pending_action": "ADMIN_MEDICINE_DELETE_CONFIRM", "reply": "请回复 1 确认执行，或回复 0 取消。", "cards": []}

            try:
                medicine_id = int(draft.get("medicineId"))
            except (TypeError, ValueError):
                return {
                    "pending_action": None,
                    "admin_medicine_delete_draft": None,
                    "reply": "商品ID无效，请重新发起。",
                    "cards": [],
                }

            payload = tools.admin_delete_medicine(token, medicine_id=medicine_id, request_id=request_id)
            if not payload.get("success", True):
                err = payload.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {
                        "pending_action": None,
                        "admin_medicine_delete_draft": None,
                        "reply": f"执行失败：{err.strip()}",
                        "cards": [],
                    }
                return {"pending_action": None, "admin_medicine_delete_draft": None, "reply": "执行失败，请稍后再试。", "cards": []}

            name = draft.get("name") or "-"
            rows = [["商品ID", medicine_id], ["名称", name], ["结果", "已删除"]]
            return {
                "pending_action": None,
                "admin_medicine_delete_draft": None,
                "admin_medicine_last_id": medicine_id,
                "reply": _fmt_lines("【执行结果】", [_fmt_kv(rows)]),
                "cards": [],
            }

        if state.get("pending_action") == "ADMIN_MEDICINE_STATUS_CONFIRM":
            user_text = state.get("message") or ""
            draft = state.get("admin_medicine_status_draft") or {}
            if not isinstance(draft, dict) or not draft:
                return {
                    "pending_action": None,
                    "admin_medicine_status_draft": None,
                    "reply": "操作信息已失效，请重新发起。",
                    "cards": [],
                }
            if is_cancel_text(user_text):
                return {"pending_action": None, "admin_medicine_status_draft": None, "reply": "已取消操作。", "cards": []}
            if not is_confirm_text(user_text):
                return {"pending_action": "ADMIN_MEDICINE_STATUS_CONFIRM", "reply": "请回复 1 确认执行，或回复 0 取消。", "cards": []}

            try:
                medicine_id = int(draft.get("medicineId"))
            except (TypeError, ValueError):
                return {
                    "pending_action": None,
                    "admin_medicine_status_draft": None,
                    "reply": "商品ID无效，请重新发起。",
                    "cards": [],
                }
            try:
                to_status = int(draft.get("toStatus"))
            except (TypeError, ValueError):
                return {
                    "pending_action": None,
                    "admin_medicine_status_draft": None,
                    "reply": "目标状态无效，请重新发起。",
                    "cards": [],
                }

            payload = tools.admin_set_medicine_status(token, medicine_id=medicine_id, status=to_status, request_id=request_id)
            if not payload.get("success", True):
                err = payload.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {
                        "pending_action": None,
                        "admin_medicine_status_draft": None,
                        "reply": f"执行失败：{err.strip()}",
                        "cards": [],
                    }
                return {"pending_action": None, "admin_medicine_status_draft": None, "reply": "执行失败，请稍后再试。", "cards": []}

            name = draft.get("name") or "-"
            rows = [["商品ID", medicine_id], ["名称", name], ["结果", "已上架" if to_status == 1 else "已下架"], ["status", to_status]]
            return {
                "pending_action": None,
                "admin_medicine_status_draft": None,
                "admin_medicine_last_id": medicine_id,
                "reply": _fmt_lines("【执行结果】", [_fmt_kv(rows)]),
                "cards": [],
            }

        idx = _extract_pick_index(re.sub(r"^查看\s*", "", message))
        medicine_id = _extract_medicine_id(message)
        if medicine_id is None and idx is not None:
            medicine_id = _resolve_medicine_id_from_index(state, idx)
        if medicine_id is None:
            medicine_id = state.get("admin_medicine_last_id")

        if message.startswith("上架") or message.startswith("下架"):
            to_status = 1 if message.startswith("上架") else 0
            raw = re.sub(r"^(上架|下架)\s*", "", message).strip()
            picked_idx = _extract_pick_index(raw)
            picked_id = _extract_medicine_id(raw)
            if picked_id is None and picked_idx is not None:
                picked_id = _resolve_medicine_id_from_index(state, picked_idx)
                if picked_id is None:
                    candidates = state.get("candidates") or []
                    if picked_idx > len(candidates):
                        picked_id = picked_idx
            if picked_id is None:
                picked_id = medicine_id
            if picked_id is None:
                return {"reply": "请提供商品ID或列表序号，例如：上架 1 或 下架 商品id=25。", "cards": []}

            preview = tools.admin_preview_medicine_status(token, medicine_id=picked_id, to_status=to_status, request_id=request_id)
            if not preview.get("success", True):
                err = preview.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"预检查失败：{err.strip()}", "cards": []}
                return {"reply": "预检查失败，请稍后再试。", "cards": []}
            data = preview.get("data") or {}
            if not isinstance(data, dict) or not data:
                return {"reply": "预检查失败：数据异常。", "cards": []}
            if not data.get("allowed", True):
                return {"reply": "无需变更：当前状态已是目标状态。", "cards": []}

            name = data.get("name") or "-"
            current_status = _medicine_status_text(data.get("currentStatus"))
            target_status = "上架" if to_status == 1 else "下架"
            draft = {"medicineId": picked_id, "toStatus": to_status, "name": name}
            return {
                "pending_action": "ADMIN_MEDICINE_STATUS_CONFIRM",
                "admin_medicine_status_draft": draft,
                "admin_medicine_last_id": picked_id,
                "reply": f"即将把 商品ID={picked_id}（{name}）从「{current_status}」改为「{target_status}」。请回复 1 确认执行，或回复 0 取消。",
                "cards": [],
            }

        if message.startswith("删除"):
            raw = re.sub(r"^删除\s*", "", message).strip()
            picked_idx = _extract_pick_index(raw)
            picked_id = _extract_medicine_id(raw)
            if picked_id is None and picked_idx is not None:
                picked_id = _resolve_medicine_id_from_index(state, picked_idx)
                if picked_id is None:
                    candidates = state.get("candidates") or []
                    if picked_idx > len(candidates):
                        picked_id = picked_idx
            if picked_id is None:
                picked_id = medicine_id
            if picked_id is None:
                return {"reply": "请提供商品ID或列表序号，例如：删除 1 或 删除 商品id=25。", "cards": []}

            preview = tools.admin_preview_medicine_delete(token, medicine_id=picked_id, request_id=request_id)
            if not preview.get("success", True):
                err = preview.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"预检查失败：{err.strip()}", "cards": []}
                return {"reply": "预检查失败，请稍后再试。", "cards": []}
            data = preview.get("data") or {}
            if not isinstance(data, dict) or not data:
                return {"reply": "预检查失败：数据异常。", "cards": []}
            if not data.get("allowed", True):
                return {"reply": "删除前必须先下架。可先输入：下架 商品id=xxx", "cards": []}

            name = data.get("name") or "-"
            draft = {"medicineId": picked_id, "name": name}
            return {
                "pending_action": "ADMIN_MEDICINE_DELETE_CONFIRM",
                "admin_medicine_delete_draft": draft,
                "admin_medicine_last_id": picked_id,
                "reply": f"即将删除 商品ID={picked_id}（{name}）。请回复 1 确认执行，或回复 0 取消。",
                "cards": [],
            }

        if any(k in message for k in ["商品列表", "药品列表", "商品库", "药品库", "搜索商品", "搜索药品", "查药品", "查询药品"]):
            keyword = re.sub(r"^(商品列表|药品列表|商品库|药品库|搜索商品|搜索药品|查药品|查询药品)\s*", "", message).strip()
            if not keyword:
                keyword = None
            payload = tools.admin_medicines_list(token, keyword=keyword, page=1, size=10, request_id=request_id)
            if not payload.get("success", True):
                err = payload.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"查询商品失败：{err.strip()}", "cards": []}
                return {"reply": "查询商品失败，请稍后再试。", "cards": []}
            data = payload.get("data") or {}
            records = data.get("records") or []
            total = data.get("total") or 0
            if not isinstance(records, list) or not records:
                return {"reply": "没有找到匹配的商品/药品。", "cards": []}

            candidates: list[Candidate] = []
            lines = [f"共 {int(total)} 条商品（展示前 10 条）："]
            for i, r in enumerate(records[:10], start=1):
                if not isinstance(r, dict):
                    continue
                mid = r.get("id")
                name = r.get("name") or "-"
                st = _medicine_status_text(r.get("status"))
                price = r.get("price")
                stock = r.get("stock")
                candidates.append(
                    {
                        "type": "MEDICINE",
                        "medicineId": int(mid or 0),
                        "name": str(name),
                        "status": int(r.get("status") or 0),
                        "stock": int(stock or 0),
                        "price": str(price) if price is not None else "0.00",
                    }
                )
                lines.append(f"{i}. 商品ID={mid} 名称={name} 状态={st} 价格={price} 库存={stock}")
            lines.append("可输入：查看 1")
            lines.append("可输入：上架 1 / 下架 1")
            lines.append("可输入：删除 1")
            return {"candidates": candidates, "reply": "\n".join(lines), "cards": []}

        if message.startswith("查看"):
            if medicine_id is None:
                return {"reply": "请提供商品ID或列表序号，例如：查看 1 或 查看 商品id=25。", "cards": []}
            detail = tools.admin_medicine_detail(token, medicine_id=medicine_id, request_id=request_id)
            if not detail.get("success", True):
                err = detail.get("error") or ""
                if isinstance(err, str) and err.strip():
                    return {"reply": f"查询商品失败：{err.strip()}", "cards": []}
                return {"reply": "查询商品失败，请稍后再试。", "cards": []}
            data = detail.get("data") or {}
            if not isinstance(data, dict) or not data:
                return {"reply": "未找到该商品。", "cards": []}
            rows = [
                ["商品ID", data.get("id")],
                ["名称", data.get("name") or "-"],
                ["状态", _medicine_status_text(data.get("status"))],
                ["价格", data.get("price")],
                ["库存", data.get("stock")],
                ["分类", data.get("categoryName") or "-"],
            ]
            return {
                "admin_medicine_last_id": int(data.get("id") or medicine_id),
                "reply": _fmt_lines("【商品详情】", [_fmt_kv(rows)]),
                "cards": [],
            }

        return {"reply": "可用指令示例：\n- 商品列表\n- 搜索商品 布洛芬\n- 查看 1\n- 上架 1 / 下架 1\n- 删除 1", "cards": []}

    def other_flow(_: GraphState) -> dict[str, Any]:
        return {
            "reply": "可用指令示例：\n- 查用户 131****0000\n- 禁用用户 id=14 原因：恶意注册\n- 启用用户 id=14 原因：核实无误\n- 待审核商家列表\n- 查看 1\n- 通过 1\n- 驳回 1 原因：材料不完整\n- 展开 1 营业执照\n- 商品列表\n- 搜索商品 布洛芬\n- 下架 1\n- 删除 1\n- 订单列表\n- 待发货订单",
            "cards": [],
        }

    def route(state: GraphState) -> str:
        if state.get("intent") == "USER_QUERY":
            return "query_flow"
        if state.get("intent") == "USER_STATUS":
            return "status_flow"
        if state.get("intent") == "MERCHANT":
            return "merchant_flow"
        if state.get("intent") == "MEDICINE":
            return "medicine_flow"
        if state.get("intent") == "ORDER":
            return "order_flow"
        return "other_flow"

    graph = StateGraph(GraphState)
    graph.add_node("normalize_input", normalize_input)
    graph.add_node("handle_pending_pick", handle_pending_pick)
    graph.add_node("query_flow", query_flow)
    graph.add_node("status_flow", status_flow)
    graph.add_node("merchant_flow", merchant_flow)
    graph.add_node("medicine_flow", medicine_flow)
    graph.add_node("order_flow", order_flow)
    graph.add_node("other_flow", other_flow)

    graph.set_entry_point("normalize_input")
    graph.add_edge("normalize_input", "handle_pending_pick")
    graph.add_conditional_edges(
        "handle_pending_pick",
        route,
        {
            "query_flow": "query_flow",
            "status_flow": "status_flow",
            "merchant_flow": "merchant_flow",
            "medicine_flow": "medicine_flow",
            "order_flow": "order_flow",
            "other_flow": "other_flow",
        },
    )
    graph.add_edge("query_flow", END)
    graph.add_edge("status_flow", END)
    graph.add_edge("merchant_flow", END)
    graph.add_edge("medicine_flow", END)
    graph.add_edge("order_flow", END)
    graph.add_edge("other_flow", END)
    return graph.compile()
