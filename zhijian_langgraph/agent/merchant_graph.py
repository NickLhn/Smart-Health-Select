from __future__ import annotations

import re
from typing import Any, Literal, Optional, TypedDict

from langgraph.graph import END, StateGraph

from agent.settings import Settings
from agent.tools_client import ToolsClient


Intent = Literal[
    "SHOP_OVERVIEW",
    "DIAGNOSIS",
    "DASHBOARD_SUMMARY",
    "INVENTORY_RISK",
    "INVENTORY_FORECAST",
    "CONVERSION_ADVICE",
    "MEDICINE_MGMT",
    "ORDERS_PENDING",
    "ORDERS_LIST",
    "ORDER_DETAIL",
    "SALES_TREND",
    "TOP_PRODUCTS",
    "REFUND_LIST",
    "REFUND_SUMMARY",
    "COMPLIANCE_QA",
    "OTHER",
]


class Candidate(TypedDict, total=False):
    type: str
    orderNo: str
    refundNo: str
    productId: int
    medicineId: int
    name: str
    amount: str
    reason: str
    sales: int
    gmv: str
    price: float
    stock: int
    specs: str
    status: int
    mainImage: str


class GraphState(TypedDict, total=False):
    message: str
    token: str
    request_id: Optional[str]
    intent: Intent
    pending_action: str | None
    pending_intent: Intent
    time_range_override: str
    candidates: list[Candidate]
    picked_refund: Candidate
    picked_product: Candidate
    picked_conv_product: Candidate
    order_no: str
    medicine_draft: dict[str, Any] | None
    last_medicine_id: int | None
    reply: str
    cards: list[dict[str, Any]]


def build_merchant_graph(settings: Settings):
    tools = ToolsClient(settings)

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

    def _extract_order_no(text: str) -> Optional[str]:
        s = (text or "").strip()
        m = re.search(r"\b(\d{12,})\b", s)
        if not m:
            return None
        return m.group(1)

    def _extract_medicine_id(text: str) -> Optional[int]:
        t = text or ""
        m = re.search(r"(?:药品id|药品ID|medicineId|medicineid|id|ID)\s*[:=：]?\s*(\d{1,18})", t, flags=re.IGNORECASE)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                return None
        m2 = re.search(r"(?:查看|上架|下架|删除)\s*(\d{1,18})\b", t)
        if m2:
            try:
                return int(m2.group(1))
            except ValueError:
                return None
        return None

    def _medicine_status_text(status: Any) -> str:
        try:
            v = int(status)
        except (TypeError, ValueError):
            return str(status)
        return "上架" if v == 1 else ("下架" if v == 0 else str(v))

    def _resolve_medicine_id_from_index(state: GraphState, idx: int) -> Optional[int]:
        candidates = state.get("candidates") or []
        if idx <= 0 or idx > len(candidates):
            return None
        picked = candidates[idx - 1]
        if str(picked.get("type") or "") != "medicine":
            return None
        try:
            return int(picked.get("medicineId"))
        except (TypeError, ValueError):
            return None

    def _is_confirm_text(text: str) -> bool:
        t = (text or "").strip().lower()
        return t in {"1", "确认", "是", "好的", "好", "可以", "ok", "okay"}

    def _is_cancel_text(text: str) -> bool:
        t = (text or "").strip().lower()
        return t in {"0", "取消", "不", "否", "不用了", "算了"}

    def _time_range_from_text(text: str, default: str) -> str:
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

    def _classify_intent(text: str) -> Intent:
        t = text or ""
        if any(k in t for k in ["药品", "商品", "药品库", "上架", "下架", "删除"]) and any(
            k in t for k in ["药品", "商品", "药品库", "上架", "下架", "删除", "查看", "详情", "列表", "搜索"]
        ):
            return "MEDICINE_MGMT"
        if "经营概览" in t or ("概览" in t and all(k in t for k in ["订单", "销售", "售后", "库存"])):
            return "SHOP_OVERVIEW"
        if any(k in t for k in ["经营诊断", "原因分析", "下滑原因", "上涨原因", "为什么", "诊断"]):
            return "DIAGNOSIS"
        if any(k in t for k in ["合规", "广告法", "违禁词", "敏感词", "处方药宣传", "OTC宣传", "话术"]):
            return "COMPLIANCE_QA"
        if any(k in t for k in ["可售天数", "库存预测", "库存周转", "周转天数", "补货建议"]):
            return "INVENTORY_FORECAST"
        if any(k in t for k in ["库存", "补货", "缺货", "低库存"]):
            return "INVENTORY_RISK"
        if any(k in t for k in ["转化", "主图", "标题", "详情页", "详情"]):
            return "CONVERSION_ADVICE"
        if "待处理" in t:
            return "ORDERS_PENDING"
        if any(k in t for k in ["待发货", "未发货", "发货单"]):
            return "ORDERS_LIST"
        if any(k in t for k in ["退款列表", "售后列表", "售后单", "退款单列表"]):
            return "REFUND_LIST"
        if any(k in t for k in ["退款", "售后", "退货", "退款率", "退款原因"]):
            return "REFUND_SUMMARY"
        if any(k in t for k in ["趋势", "走势", "曲线"]):
            return "SALES_TREND"
        if any(k in t for k in ["热销", "排行", "Top", "TOP", "卖得最好", "爆款"]):
            return "TOP_PRODUCTS"
        if any(k in t for k in ["订单量", "销售额", "成交额", "GMV", "概览"]) and any(k in t for k in ["今天", "今日", "昨天", "近"]):
            return "DASHBOARD_SUMMARY"
        if "订单" in t and ("详情" in t or _extract_order_no(t)):
            return "ORDER_DETAIL"
        return "OTHER"

    def _error_reply(payload: dict[str, Any], fallback: str) -> Optional[dict[str, Any]]:
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

    def _has_explicit_time_range(text: str) -> bool:
        t = text or ""
        return any(k in t for k in ["今天", "今日", "昨天", "近7", "最近7", "一周", "近30", "最近30", "30天", "一个月"])

    def _ask_time_range(next_intent: Intent) -> dict[str, Any]:
        return {
            "pending_action": "TIME_RANGE_PICK",
            "pending_intent": next_intent,
            "cards": [],
            "reply": "看哪个时间范围？回复：1=今天；2=近7天；3=近30天",
        }

    def _order_cards(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        cards: list[dict[str, Any]] = []
        for it in items:
            order_no = it.get("orderNo")
            status = it.get("statusText")
            pay_amount = it.get("payAmount")
            items_summary = it.get("itemsSummary")
            cards.append(
                {
                    "type": "order",
                    "id": f"order:{order_no}",
                    "title": f"订单 {order_no}",
                    "subtitle": f"{status}｜¥{pay_amount}",
                    "description": items_summary,
                    "orderNo": order_no,
                    "status": status,
                    "payAmount": pay_amount,
                    "itemsSummary": items_summary,
                }
            )
        return cards

    def _refund_cards(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        cards: list[dict[str, Any]] = []
        for it in items:
            refund_no = it.get("refundNo")
            order_no = it.get("orderNo")
            amount = it.get("amount")
            status = it.get("status")
            reason = it.get("reason")
            cards.append(
                {
                    "type": "refund",
                    "id": f"refund:{refund_no}",
                    "title": f"退款单 {refund_no}",
                    "subtitle": f"{status}｜¥{amount}",
                    "description": f"订单{order_no}｜{reason}",
                    "refundNo": refund_no,
                    "orderNo": order_no,
                    "status": status,
                    "amount": amount,
                    "reason": reason,
                }
            )
        return cards

    def _product_cards(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
        cards: list[dict[str, Any]] = []
        for it in items:
            pid = it.get("productId")
            if pid is None:
                pid = it.get("id")
            name = it.get("name")
            gmv = it.get("gmv")
            sales = it.get("sales")
            price = it.get("price")
            stock = it.get("stock")
            specs = it.get("specs")
            subtitle_parts: list[str] = []
            if gmv is not None or sales is not None:
                subtitle_parts.append(f"销售额¥{gmv}｜销量{sales}件")
            if price is not None:
                subtitle_parts.append(f"¥{price}")
            if stock is not None:
                subtitle_parts.append(f"库存{stock}")
            cards.append(
                {
                    "type": "product",
                    "id": f"product:{pid}",
                    "title": str(name or ""),
                    "subtitle": "｜".join([p for p in subtitle_parts if p]),
                    "description": str(specs or ""),
                    "productId": pid,
                    "name": name,
                    "gmv": gmv,
                    "sales": sales,
                    "price": price,
                    "stock": stock,
                    "specs": specs,
                }
            )
        return cards

    def normalize_input(state: GraphState) -> dict[str, Any]:
        message = state.get("message") or ""
        pending_action = state.get("pending_action")
        idx = _extract_pick_index(message)
        order_no = _extract_order_no(message)
        updates: dict[str, Any] = {"message": message, "cards": []}

        if pending_action in {"MEDICINE_STATUS_CONFIRM", "MEDICINE_DELETE_CONFIRM"}:
            updates["intent"] = "MEDICINE_MGMT"
            return updates

        if pending_action == "CONV_NEED_PRODUCT":
            m = (message or "").strip()
            if m in {"取消", "不用了", "算了"}:
                updates["pending_action"] = None
            elif any(k in m for k in ["订单", "退款", "售后", "库存", "趋势", "排行", "概览", "诊断", "合规", "话术"]):
                updates["pending_action"] = None
            else:
                updates["intent"] = "CONVERSION_ADVICE"
                return updates

        if pending_action == "TIME_RANGE_PICK":
            if idx is not None:
                updates["intent"] = state.get("pending_intent") or "OTHER"
                return updates
            updates["pending_action"] = None
            updates["pending_intent"] = None
        if pending_action == "REFUND_PICK":
            if idx is not None:
                updates["intent"] = "REFUND_LIST"
                return updates
            updates["pending_action"] = None
            updates["candidates"] = []
        if pending_action == "PRODUCT_PICK":
            if idx is not None:
                updates["intent"] = "TOP_PRODUCTS"
                return updates
            updates["pending_action"] = None
            updates["candidates"] = []
        if pending_action == "CONV_PRODUCT_PICK":
            if idx is not None:
                updates["intent"] = "CONVERSION_ADVICE"
                return updates
            updates["pending_action"] = None
            updates["candidates"] = []
        if pending_action == "PENDING_PICK":
            updates["intent"] = "ORDERS_PENDING"
            return updates
        if pending_action == "ORDER_PICK" and (idx is not None or order_no):
            updates["intent"] = "ORDER_DETAIL"
        else:
            updates["intent"] = _classify_intent(message)

        if order_no:
            updates["order_no"] = order_no
        return updates

    def handle_pending_pick(state: GraphState) -> dict[str, Any]:
        action = state.get("pending_action")
        if not action:
            return {}

        if action == "TIME_RANGE_PICK":
            idx = _extract_pick_index(state.get("message") or "")
            if idx not in {1, 2, 3}:
                return {"pending_action": "TIME_RANGE_PICK", "reply": "请选择时间范围：1今天/2近7天/3近30天"}
            tr = "today" if idx == 1 else ("last7" if idx == 2 else "last30")
            return {"time_range_override": tr, "pending_action": None, "pending_intent": None}

        idx = _extract_pick_index(state.get("message") or "")
        if idx is None:
            return {}
        candidates = state.get("candidates") or []
        if idx > len(candidates):
            return {}
        picked = candidates[idx - 1]

        if action == "ORDER_PICK":
            order_no = picked.get("orderNo")
            if order_no:
                return {"order_no": str(order_no), "pending_action": None}
            return {}

        if action == "REFUND_PICK":
            return {"pending_action": None, "candidates": [], "picked_refund": picked}

        if action == "PRODUCT_PICK":
            return {"pending_action": None, "candidates": [], "picked_product": picked}

        if action == "CONV_PRODUCT_PICK":
            return {"pending_action": None, "candidates": [], "picked_conv_product": picked}

        return {}

    def medicine_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法管理药品。"}

        message = (state.get("message") or "").strip()
        pending_action = state.get("pending_action")

        if pending_action in {"MEDICINE_STATUS_CONFIRM", "MEDICINE_DELETE_CONFIRM"}:
            draft = state.get("medicine_draft") or {}
            if not isinstance(draft, dict) or not draft:
                return {"pending_action": None, "medicine_draft": None, "reply": "操作信息已失效，请重新发起。", "cards": []}
            if _is_cancel_text(message):
                return {"pending_action": None, "medicine_draft": None, "reply": "已取消操作。", "cards": []}
            if not _is_confirm_text(message):
                return {"pending_action": pending_action, "reply": "请回复 1 确认执行，或回复 0 取消。", "cards": []}

            try:
                medicine_id = int(draft.get("medicineId"))
            except (TypeError, ValueError):
                return {"pending_action": None, "medicine_draft": None, "reply": "药品ID无效，请重新发起。", "cards": []}

            if pending_action == "MEDICINE_STATUS_CONFIRM":
                try:
                    to_status = int(draft.get("toStatus"))
                except (TypeError, ValueError):
                    return {"pending_action": None, "medicine_draft": None, "reply": "目标状态无效，请重新发起。", "cards": []}
                payload = tools.merchant_set_medicine_status(token, medicine_id=medicine_id, status=to_status, request_id=request_id)
                err = _error_reply(payload, "执行失败，请稍后再试。")
                if err:
                    return {"pending_action": None, "medicine_draft": None, **err}
                return {
                    "pending_action": None,
                    "medicine_draft": None,
                    "last_medicine_id": medicine_id,
                    "reply": f"已完成：药品ID={medicine_id} 状态已更新为 {_medicine_status_text(to_status)}。",
                    "cards": [],
                }

            payload = tools.merchant_delete_medicine(token, medicine_id=medicine_id, request_id=request_id)
            err = _error_reply(payload, "执行失败，请稍后再试。")
            if err:
                return {"pending_action": None, "medicine_draft": None, **err}
            return {
                "pending_action": None,
                "medicine_draft": None,
                "last_medicine_id": medicine_id,
                "reply": f"已完成：药品ID={medicine_id} 已删除（逻辑删除）。",
                "cards": [],
            }

        idx = _extract_pick_index(message)
        medicine_id = _extract_medicine_id(message)
        if medicine_id is None and idx is not None:
            medicine_id = _resolve_medicine_id_from_index(state, idx)
        if medicine_id is None:
            medicine_id = state.get("last_medicine_id")

        if any(k in message for k in ["药品列表", "我的药品", "药品库", "商品列表", "我的商品", "搜索药品", "查药品", "查询药品"]):
            status = None
            if "只看上架" in message or ("上架" in message and "下架" not in message and "列表" in message):
                status = 1
            if "只看下架" in message or ("下架" in message and "上架" not in message and "列表" in message):
                status = 0
            keyword = message
            keyword = re.sub(r"^(药品列表|我的药品|药品库|商品列表|我的商品|搜索药品|查药品|查询药品)\s*", "", keyword).strip()
            if keyword in {"只看上架", "只看下架"}:
                keyword = ""
            if not keyword:
                keyword = None

            payload = tools.merchant_medicines_list(token, keyword=keyword, status=status, page=1, size=10, request_id=request_id)
            err = _error_reply(payload, "查询失败，请稍后再试。")
            if err:
                return err
            data = payload.get("data") or {}
            records = data.get("records") or []
            total = data.get("total") or 0
            if not isinstance(records, list) or not records:
                return {"reply": "没有找到匹配的药品。", "cards": []}

            candidates: list[Candidate] = []
            lines = [f"共 {int(total)} 条药品（展示前 10 条）："]
            for i, r in enumerate(records[:10], start=1):
                if not isinstance(r, dict):
                    continue
                mid = r.get("id")
                name = r.get("name") or "-"
                st = _medicine_status_text(r.get("status"))
                price = r.get("price")
                stock = r.get("stock")
                img = r.get("mainImage") or ""
                candidates.append(
                    {
                        "type": "medicine",
                        "medicineId": int(mid) if mid is not None else 0,
                        "name": str(name),
                        "status": int(r.get("status") or 0),
                        "price": float(price or 0),
                        "stock": int(stock or 0),
                        "mainImage": str(img or ""),
                    }
                )
                lines.append(f"{i}. 药品ID={mid} 名称={name} 状态={st} 价格={price} 库存={stock}")
            lines.append("")
            lines.append("可输入：查看 1 / 上架 1 / 下架 1 / 删除 1")
            return {"candidates": candidates, "reply": "\n".join(lines), "cards": []}

        if message.startswith("查看") or "药品详情" in message:
            if medicine_id is None:
                return {"reply": "请提供药品ID或列表序号，例如：查看 1 或 查看 药品id=25。", "cards": []}
            payload = tools.merchant_medicine_detail(token, medicine_id=medicine_id, request_id=request_id)
            err = _error_reply(payload, "未找到该药品或无权查看。")
            if err:
                return err
            data = payload.get("data") or {}
            if not isinstance(data, dict) or not data:
                return {"reply": "未找到该药品或无权查看。", "cards": []}
            img = data.get("mainImage")
            lines = ["【药品详情】"]
            lines.append(f"药品ID：{data.get('id')}")
            lines.append(f"名称：{data.get('name')}")
            lines.append(f"状态：{_medicine_status_text(data.get('status'))}")
            lines.append(f"价格：{data.get('price')}")
            lines.append(f"库存：{data.get('stock')}")
            if data.get("specs"):
                lines.append(f"规格：{data.get('specs')}")
            if data.get("categoryName"):
                lines.append(f"分类：{data.get('categoryName')}")
            if img:
                lines.append(f"主图：{img}")
            lines.append("")
            lines.append(f"可输入：上架 {medicine_id} / 下架 {medicine_id} / 删除 {medicine_id}")
            return {"last_medicine_id": medicine_id, "reply": "\n".join(lines), "cards": []}

        if message.startswith("上架") or message.startswith("下架"):
            if medicine_id is None:
                return {"reply": "请提供药品ID或列表序号，例如：上架 1 / 下架 药品id=25。", "cards": []}
            to_status = 1 if message.startswith("上架") else 0
            preview = tools.merchant_preview_medicine_status(token, medicine_id=medicine_id, to_status=to_status, request_id=request_id)
            err = _error_reply(preview, "预览失败，请稍后再试。")
            if err:
                return err
            pdata = preview.get("data") or {}
            if not isinstance(pdata, dict):
                return {"reply": "预览数据异常。", "cards": []}
            if not pdata.get("allowed", True):
                return {"reply": f"无需执行：当前状态已是 {_medicine_status_text(pdata.get('currentStatus'))}。", "cards": []}
            draft = {"medicineId": medicine_id, "toStatus": to_status}
            return {
                "pending_action": "MEDICINE_STATUS_CONFIRM",
                "medicine_draft": draft,
                "last_medicine_id": medicine_id,
                "reply": "\n".join(
                    [
                        "【预览】",
                        f"药品：{pdata.get('name') or '-'}（ID={medicine_id}）",
                        f"当前状态：{_medicine_status_text(pdata.get('currentStatus'))}",
                        f"目标状态：{_medicine_status_text(to_status)}",
                        "请回复 1 确认执行 / 0 取消",
                    ]
                ),
                "cards": [],
            }

        if message.startswith("删除"):
            if medicine_id is None:
                return {"reply": "请提供药品ID或列表序号，例如：删除 1 或 删除 药品id=25。", "cards": []}
            preview = tools.merchant_preview_medicine_delete(token, medicine_id=medicine_id, request_id=request_id)
            err = _error_reply(preview, "预览失败，请稍后再试。")
            if err:
                return err
            pdata = preview.get("data") or {}
            if not isinstance(pdata, dict):
                return {"reply": "预览数据异常。", "cards": []}
            if not pdata.get("allowed", True):
                return {
                    "reply": "\n".join(
                        [
                            "【预览】",
                            f"药品：{pdata.get('name') or '-'}（ID={medicine_id}）",
                            f"当前状态：{_medicine_status_text(pdata.get('currentStatus'))}",
                            "删除前必须先下架。",
                            f"可直接输入：下架 {medicine_id}",
                        ]
                    ),
                    "cards": [],
                }
            draft = {"medicineId": medicine_id}
            return {
                "pending_action": "MEDICINE_DELETE_CONFIRM",
                "medicine_draft": draft,
                "last_medicine_id": medicine_id,
                "reply": "\n".join(
                    [
                        "【预览】",
                        f"药品：{pdata.get('name') or '-'}（ID={medicine_id}）",
                        "操作：删除（逻辑删除，历史订单不受影响）",
                        "请回复 1 确认执行 / 0 取消",
                    ]
                ),
                "cards": [],
            }

        return {
            "reply": "可用指令示例：\n- 药品列表\n- 搜索药品 布洛芬\n- 只看下架药品列表\n- 查看 1\n- 上架 1 / 下架 1\n- 删除 1",
            "cards": [],
        }

    def dashboard_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查看概览。"}

        tr = _time_range_from_text(state.get("message") or "", default="today")
        payload = tools.merchant_dashboard_summary(token, time_range=tr, request_id=request_id)
        err = _error_reply(payload, "暂无数据。")
        if err:
            return err
        data = payload.get("data") or {}
        reply = (
            f"概览（{data.get('timeRangeApplied', {}).get('type', tr)}）："
            f"支付订单 {data.get('ordersPaid', 0)}，"
            f"订单 {data.get('ordersTotal', 0)}，"
            f"GMV ¥{data.get('gmv') or '0.00'}，"
            f"客单价 ¥{data.get('aov') or '0.00'}，"
            f"退款 ¥{data.get('refundAmount') or '0.00'}（{data.get('refundCount', 0)}单），"
            f"待发货 {data.get('pendingShipCount', 0)}。"
        )
        return {"reply": reply}

    def overview_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查看经营概览。"}

        msg = state.get("message") or ""
        tr = state.get("time_range_override") or _time_range_from_text(msg, default="today")

        dash = tools.merchant_dashboard_summary(token, time_range=tr, request_id=request_id)
        err = _error_reply(dash, "暂无概览数据。")
        if err:
            return err
        dash_data = dash.get("data") or {}

        pending = tools.merchant_orders_pending_summary(token, request_id=request_id)
        pending_data: dict[str, Any] = {}
        if pending.get("success", True):
            pending_data = pending.get("data") or {}

        refunds = tools.merchant_refunds_summary(token, time_range=tr if tr in {"today", "yesterday"} else "last7", request_id=request_id)
        refunds_data: dict[str, Any] = {}
        if refunds.get("success", True):
            refunds_data = refunds.get("data") or {}

        low = tools.merchant_inventory_low(token, threshold=7, limit=10, request_id=request_id)
        low_items = []
        if low.get("success", True):
            low_items = (low.get("data") or {}).get("items") or []

        lines: list[str] = []
        lines.append(
            f"经营概览（{dash_data.get('timeRangeApplied', {}).get('type', tr)}）："
            f"订单 {dash_data.get('ordersTotal', 0)}，支付订单 {dash_data.get('ordersPaid', 0)}，"
            f"GMV ¥{dash_data.get('gmv') or '0.00'}，客单价 ¥{dash_data.get('aov') or '0.00'}。"
        )
        lines.append(
            f"履约：待发货 {pending_data.get('waitShip', dash_data.get('pendingShipCount', 0))}，"
            f"待审核 {pending_data.get('waitAudit', dash_data.get('pendingAuditCount', 0))}。"
        )
        lines.append(
            f"售后：退款 ¥{refunds_data.get('refundAmount') or dash_data.get('refundAmount') or '0.00'}"
            f"（{refunds_data.get('refundCount', dash_data.get('refundCount', 0))}单）。"
        )
        if not low_items:
            lines.append("库存：暂无库存≤7的商品。")
        else:
            top = "；".join(f"{it.get('name')}({it.get('stock')})" for it in low_items[:5] if isinstance(it, dict))
            lines.append(f"库存：低库存≤7（前5）{top}。")
        return {"reply": "\n".join(lines)}

    def inventory_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查看库存。"}

        payload = tools.merchant_inventory_low(token, threshold=7, limit=20, request_id=request_id)
        err = _error_reply(payload, "暂无库存数据。")
        if err:
            return err
        data = payload.get("data") or {}
        items = data.get("items") or []
        if not items:
            return {"reply": "当前没有库存≤7的商品。"}

        lines = ["库存风险（库存≤7）建议补货："]
        for i, it in enumerate(items[:10], start=1):
            lines.append(f"{i}）{it.get('name')} 库存{it.get('stock')}，建议补{it.get('suggestQty')}")
        if len(items) > 10:
            lines.append(f"（共{len(items)}个，已展示前10个）")
        return {"reply": "\n".join(lines)}

    def inventory_forecast_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法做库存预测。"}

        msg = state.get("message") or ""
        tr = state.get("time_range_override") or (_time_range_from_text(msg, default="last30") if _has_explicit_time_range(msg) else "last30")
        payload = tools.merchant_inventory_forecast(
            token,
            time_range=tr,
            low_stock_threshold=20,
            target_days=14,
            limit=20,
            request_id=request_id,
        )
        err = _error_reply(payload, "暂无库存预测数据。")
        if err:
            return err
        data = payload.get("data") or {}
        items = data.get("items") or []
        if not items:
            return {"reply": "暂无可用的库存预测数据。"}

        risk_items = [it for it in items if isinstance(it, dict) and it.get("riskLevel") in {"CRITICAL", "WARN"}]
        show = risk_items[:10] if risk_items else items[:10]

        lines = [f"库存可售天数（{tr}口径）：重点关注（前{len(show)}）"]
        cards: list[dict[str, Any]] = []
        for i, it in enumerate(show, start=1):
            name = it.get("name")
            stock = it.get("stock")
            dos = it.get("daysOfSupply")
            avg = it.get("avgDailySales")
            risk = it.get("riskLevel")
            rec = it.get("recommendReplenishQty")
            dos_text = "未知" if dos is None else f"{dos}天"
            lines.append(f"{i}）{name}｜库存{stock}｜可售{dos_text}｜日均{avg}｜建议补{rec}｜{risk}；")
            cards.append(
                {
                    "type": "inventory_forecast",
                    "id": f"inv:{it.get('productId')}",
                    "title": str(name or ""),
                    "subtitle": f"库存{stock}｜可售{dos_text}｜{risk}",
                    "productId": it.get("productId"),
                    "stock": stock,
                    "daysOfSupply": dos,
                    "avgDailySales": avg,
                    "recommendReplenishQty": rec,
                    "riskLevel": risk,
                }
            )
        return {"reply": "\n".join(lines), "cards": cards}

    def diagnosis_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法做经营诊断。"}

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

        def fmt_pct(v: Any) -> str:
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

        advice: list[str] = []
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

    def compliance_flow(state: GraphState) -> dict[str, Any]:
        msg = (state.get("message") or "").strip()
        if any(k in msg for k in ["违禁词", "敏感词", "广告法"]):
            return {
                "reply": "\n".join(
                    [
                        "合规提示（常见高风险表达）：",
                        "1）绝对化：最/第一/顶级/全网最低/100%等。",
                        "2）疗效承诺：治愈/根治/立刻见效/包好/不复发等。",
                        "3）医疗背书：医生推荐/权威认证（无资质证明）等。",
                        "4）处方药宣传：面向公众推广处方药功效属于高风险。",
                        "建议：改为客观描述（成分/规格/适用范围/用法用量），避免承诺性词汇。",
                    ]
                )
            }
        if "话术" in msg and any(k in msg for k in ["售后", "退款", "退货", "差评"]):
            return {
                "reply": "\n".join(
                    [
                        "售后话术模板（可直接复制）：",
                        "1）先共情：非常抱歉给你带来不便，我们理解你的着急。",
                        "2）给方案：我这边优先为你处理：①补发/换货 ②退款 ③延迟补偿（按平台规则）。",
                        "3）要信息：麻烦提供订单号/问题照片/期望处理方式，我马上跟进。",
                        "4）定时回访：我会在X小时内给你明确处理结果，如未解决你可以直接回复我。",
                    ]
                )
            }
        return {
            "reply": "你可以问我：广告法违禁词有哪些、处方药宣传注意事项、售后退款/差评回复话术。也可以把你的标题/详情文案发我，我帮你改成更合规的表达。"
        }

    def conversion_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法给出转化建议。"}

        picked = state.get("picked_conv_product")
        if isinstance(picked, dict) and picked.get("name"):
            name = str(picked.get("name") or "")
            price = picked.get("price")
            stock = picked.get("stock")
            specs = str(picked.get("specs") or "")
            base = [
                f"转化优化建议（商品：{name}）：",
                f"基础信息：{('规格' + specs) if specs else '规格—'}｜{('¥' + str(price)) if price is not None else '价格—'}｜{('库存' + str(stock)) if stock is not None else '库存—'}",
                "主图：1）首图明确“品名+规格+数量/片数/尺寸”；2）增加场景图（出行/家庭/户外）与卖点对比；3）注意字号清晰、避免小字堆叠。",
                "标题：建议结构=品牌/品名+规格/数量+核心卖点（透气/防水/独立包装等）+适用场景；避免“最/第一/100%”等绝对化词。",
                "详情页：1）3秒说明白适用人群与场景；2）把“规格/材质/贴合度/过敏提示”做成表格；3）展示资质/售后/发货时效提升信任。",
                "如果你把当前标题/主图文案/详情卖点发我，我可以按你的现状逐条改写。",
            ]
            return {"reply": "\n".join(base), "pending_action": None, "picked_conv_product": {}}

        msg = (state.get("message") or "").strip()
        keyword = ""
        m = re.search(r"[【\[]([^】\]]{1,40})[】\]]", msg)
        if m:
            keyword = (m.group(1) or "").strip()
        if not keyword:
            m2 = re.search(r"商品[:：\s]*([^\s，,。.!！?？（）()]{1,30})", msg)
            if m2:
                keyword = (m2.group(1) or "").strip().strip("【】[]")
        if not keyword and "转化" in msg:
            left = re.split(r"(的)?转化", msg, maxsplit=1)[0]
            keyword = left.strip(" ：:，,。.!！?？（）()\"'【】[]")
        if not keyword and state.get("pending_action") == "CONV_NEED_PRODUCT":
            keyword = msg.strip(" ：:，,。.!！?？（）()\"'【】[]")
        if not keyword:
            return {
                "pending_action": "CONV_NEED_PRODUCT",
                "reply": "\n".join(
                    [
                        "提升转化建议（通用）：",
                        "主图：1）首图突出核心卖点/规格/数量；2）对比图/场景图提升理解；3）统一风格、避免小字难读。",
                        "标题：1）品牌+品名+规格+关键功效；2）包含高频搜索词；3）避免堆叠无关词与违禁词。",
                        "详情页：1）3秒说明白适用人群/功效；2）用法用量/禁忌醒目；3）资质/售后/配送承诺增强信任。",
                        "——",
                        "把商品名发我（例如：创可贴），我会按该商品给更针对的建议。",
                    ]
                )
            }

        def _normalize_product_keyword(k: str) -> str:
            kk = (k or "").strip()
            for suf in ["缓释胶囊", "颗粒", "胶囊", "片", "丸", "粉", "口服液", "滴剂", "喷雾", "凝胶", "软膏", "乳膏", "贴"]:
                if kk.endswith(suf) and len(kk) > len(suf):
                    kk = kk[: -len(suf)]
                    kk = kk.strip()
                    break
            return kk

        search_kw = keyword
        payload = tools.merchant_products_search(token, keyword=search_kw, limit=5, request_id=request_id)
        err = _error_reply(payload, f"没找到“{keyword}”相关商品。")
        if err:
            return {**err, "pending_action": "CONV_NEED_PRODUCT"}
        items = (payload.get("data") or {}).get("items") or []
        if (not isinstance(items, list) or not items) and _normalize_product_keyword(search_kw) != search_kw:
            search_kw = _normalize_product_keyword(search_kw)
            payload = tools.merchant_products_search(token, keyword=search_kw, limit=5, request_id=request_id)
            if payload.get("success", True):
                items = (payload.get("data") or {}).get("items") or []
        if not isinstance(items, list) or not items:
            return {
                "pending_action": "CONV_NEED_PRODUCT",
                "reply": f"没找到“{keyword}”相关商品。你可以换个关键词（例如：布洛芬/创可贴）或发商品ID。",
            }

        exact = None
        for it in items:
            if not isinstance(it, dict):
                continue
            name = str(it.get("name") or "")
            if name and (keyword in name or name in keyword):
                exact = it
                break
        if exact is None and len(items) == 1 and isinstance(items[0], dict):
            exact = items[0]

        if exact is not None:
            candidate: Candidate = {
                "type": "product",
                "productId": int(exact.get("id") or 0),
                "name": str(exact.get("name") or ""),
                "price": float(exact.get("price") or 0),
                "stock": int(exact.get("stock") or 0),
                "sales": int(exact.get("sales") or 0),
                "specs": str(exact.get("specs") or ""),
            }
            name = candidate.get("name") or ""
            price = candidate.get("price")
            stock = candidate.get("stock")
            specs = candidate.get("specs") or ""
            base = [
                f"转化优化建议（商品：{name}）：",
                f"基础信息：{('规格' + specs) if specs else '规格—'}｜¥{price}｜库存{stock}",
                "主图：1）首图明确“品名+规格+数量/片数/尺寸”；2）增加场景图（出行/家庭/户外）与卖点对比；3）注意字号清晰、避免小字堆叠。",
                "标题：建议结构=品牌/品名+规格/数量+核心卖点（透气/防水/独立包装等）+适用场景；避免“最/第一/100%”等绝对化词。",
                "详情页：1）3秒说明白适用人群与场景；2）把“规格/材质/贴合度/过敏提示”做成表格；3）展示资质/售后/发货时效提升信任。",
                "如果你把当前标题/主图文案/详情卖点发我，我可以按你的现状逐条改写。",
            ]
            return {
                "reply": "\n".join(base),
                "pending_action": None,
                "picked_conv_product": candidate,
                "cards": _product_cards([exact]),
            }

        candidates: list[Candidate] = []
        for it in items[:5]:
            if not isinstance(it, dict):
                continue
            candidates.append(
                {
                    "type": "product",
                    "productId": int(it.get("id") or 0),
                    "name": str(it.get("name") or ""),
                    "price": float(it.get("price") or 0),
                    "stock": int(it.get("stock") or 0),
                    "sales": int(it.get("sales") or 0),
                    "specs": str(it.get("specs") or ""),
                }
            )
        lines = ["找到多个匹配商品（回复序号选择后给出转化建议）："]
        for i, c in enumerate(candidates, start=1):
            lines.append(f"{i}）{c.get('name')}｜¥{c.get('price')}｜库存{c.get('stock')}；")
        return {
            "pending_action": "CONV_PRODUCT_PICK",
            "candidates": candidates,
            "cards": _product_cards(items[:5]),
            "reply": "\n".join(lines),
        }

    def orders_pending_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查询订单。"}

        if state.get("pending_action") == "PENDING_PICK":
            idx = _extract_pick_index(state.get("message") or "")
            if idx not in {1, 2, 3}:
                return {"pending_action": "PENDING_PICK", "reply": "请回复 1待发货/2待审核/3售后。"}
            if idx == 3:
                refunds = tools.merchant_refunds_list(token, status="PENDING", time_range="last30", page=1, page_size=10, request_id=request_id)
                err = _error_reply(refunds, "暂无售后记录。")
                if err:
                    return err
                data = refunds.get("data") or {}
                items = data.get("items") or []
                if not items:
                    return {"pending_action": None, "reply": "当前没有待处理售后/退款。"}
                candidates: list[Candidate] = []
                lines = ["待处理售后/退款（回复序号可查看详情）："]
                for i2, it in enumerate(items, start=1):
                    candidates.append(
                        {
                            "type": "refund",
                            "refundNo": str(it.get("refundNo") or ""),
                            "orderNo": str(it.get("orderNo") or ""),
                            "amount": str(it.get("amount") or ""),
                            "reason": str(it.get("reason") or ""),
                        }
                    )
                    lines.append(
                        f"{i2}）退款单{it.get('refundNo')}｜订单{it.get('orderNo')}｜¥{it.get('amount')}｜{it.get('reason')}；"
                    )
                return {
                    "pending_action": "REFUND_PICK",
                    "candidates": candidates,
                    "cards": _refund_cards(items),
                    "reply": "\n".join(lines),
                }

            status = "WAIT_SHIP" if idx == 1 else "WAIT_AUDIT"
            payload = tools.merchant_orders_list(
                token,
                status=status,
                time_range="last30",
                sort="timeoutRiskDesc",
                page=1,
                page_size=10,
                request_id=request_id,
            )
            err = _error_reply(payload, "暂无订单。")
            if err:
                return err
            data = payload.get("data") or {}
            items = data.get("items") or []
            if not items:
                return {"pending_action": None, "reply": "当前没有待处理订单。"}
            candidates: list[Candidate] = [{"type": "order", "orderNo": str(it.get("orderNo") or "")} for it in items if it.get("orderNo")]
            lines = ["待处理订单（回复序号可查看详情）："]
            for i2, it in enumerate(items, start=1):
                lines.append(
                    f"{i2}）{it.get('orderNo')}｜{it.get('statusText')}｜¥{it.get('payAmount')}｜{it.get('itemsSummary')}；"
                )
            return {
                "pending_action": "ORDER_PICK",
                "candidates": candidates,
                "cards": _order_cards(items),
                "reply": "\n".join(lines),
            }

        payload = tools.merchant_orders_pending_summary(token, request_id=request_id)
        err = _error_reply(payload, "暂无待处理数据。")
        if err:
            return err
        data = payload.get("data") or {}
        reply = (
            f"待处理概览：待发货 {data.get('waitShip', 0)}，待审核 {data.get('waitAudit', 0)}，售后待处理 {data.get('waitRefund', 0)}。\n"
            "需要我先展开哪一类？回复：1待发货/2待审核/3售后"
        )
        return {"pending_action": "PENDING_PICK", "reply": reply}

    def orders_list_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查询订单。"}

        msg = state.get("message") or ""
        status = None
        if any(k in msg for k in ["待发货", "未发货"]):
            status = "WAIT_SHIP"
        tr = _time_range_from_text(msg, default="last30")
        keyword = _extract_order_no(msg)
        payload = tools.merchant_orders_list(
            token,
            status=status,
            time_range=tr,
            keyword=keyword,
            sort="timeoutRiskDesc" if status == "WAIT_SHIP" else "createTimeDesc",
            page=1,
            page_size=10,
            request_id=request_id,
        )
        err = _error_reply(payload, "暂无订单。")
        if err:
            return err
        data = payload.get("data") or {}
        items = data.get("items") or []
        if not items:
            return {"reply": "没有查到符合条件的订单。"}
        candidates: list[Candidate] = [{"type": "order", "orderNo": str(it.get("orderNo") or "")} for it in items if it.get("orderNo")]
        lines = ["订单列表（回复序号可查看详情）："]
        for i, it in enumerate(items, start=1):
            lines.append(
                f"{i}）{it.get('orderNo')}｜{it.get('statusText')}｜¥{it.get('payAmount')}｜{it.get('itemsSummary')}；"
            )
        return {
            "pending_action": "ORDER_PICK",
            "candidates": candidates,
            "cards": _order_cards(items),
            "reply": "\n".join(lines),
        }

    def order_detail_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        order_no = state.get("order_no") or _extract_order_no(state.get("message") or "")
        if not token:
            return {"reply": "缺少登录token，无法查询订单详情。"}
        if not order_no:
            return {"reply": "请提供订单号，或先让我列出订单列表供你选择。"}

        payload = tools.merchant_order_detail(token, order_no, request_id=request_id)
        err = _error_reply(payload, "未找到该订单。")
        if err:
            return err
        data = payload.get("data") or {}
        order = data.get("order") or {}
        items = data.get("items") or []
        item_text = "、".join(f"{it.get('name')}×{it.get('quantity')}" for it in items[:3] if isinstance(it, dict))
        reply = "\n".join(
            [
                f"订单{order.get('orderNo')}: {order.get('statusText')}",
                f"实付：¥{order.get('payAmount') or '0.00'}",
                f"商品：{item_text or '—'}",
                f"收货：{order.get('receiverName') or ''} {order.get('receiverPhoneMasked') or ''}",
                f"下单：{order.get('createTime') or '—'} 支付：{order.get('paymentTime') or '—'}",
            ]
        )
        return {"reply": reply}

    def sales_trend_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查看趋势。"}

        msg = state.get("message") or ""
        if state.get("time_range_override"):
            tr = state["time_range_override"]
        else:
            if not _has_explicit_time_range(msg):
                return _ask_time_range("SALES_TREND")
            tr = _time_range_from_text(msg, default="last7")
        metric = "gmv"
        if "订单" in msg and "销售额" not in msg and "GMV" not in msg:
            metric = "orders"
        payload = tools.merchant_sales_trend(token, metric=metric, time_range=tr, request_id=request_id)
        err = _error_reply(payload, "暂无趋势数据。")
        if err:
            return err
        data = payload.get("data") or {}
        points = data.get("points") or []
        if not points:
            return {"reply": "暂无趋势数据。"}
        if metric == "orders":
            total = sum(int(p.get("value") or 0) for p in points if isinstance(p, dict))
            reply = f"近{tr}订单趋势：共{total}单，共{len(points)}天有数据。"
            return {"reply": reply}
        total = 0.0
        for p in points:
            try:
                total += float(p.get("value") or 0)
            except Exception:
                continue
        reply = f"近{tr}销售额趋势：累计¥{total:.2f}，共{len(points)}天有数据。"
        return {"reply": reply}

    def top_products_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查看排行。"}

        picked_product = (state or {}).get("picked_product")
        if isinstance(picked_product, dict) and picked_product.get("name"):
            name = picked_product.get("name")
            sales = picked_product.get("sales")
            gmv = picked_product.get("gmv")
            return {
                "reply": f"商品：{name}\n近{state.get('time_range_override') or 'last7'}表现：销量{sales}，销售额¥{gmv}。\n——\n需要我给这个商品做转化优化建议吗？"
            }

        msg = state.get("message") or ""
        if state.get("time_range_override"):
            tr = state["time_range_override"]
        else:
            if not _has_explicit_time_range(msg):
                return _ask_time_range("TOP_PRODUCTS")
            tr = _time_range_from_text(msg, default="last7")
        by = "gmv"
        if "销量" in msg:
            by = "sales"
        payload = tools.merchant_top_products(token, by=by, time_range=tr, limit=10, request_id=request_id)
        err = _error_reply(payload, "暂无排行数据。")
        if err:
            return err
        data = payload.get("data") or {}
        items = data.get("items") or []
        if not items:
            return {"reply": "暂无排行数据。"}
        lines = [f"{'销售额' if by == 'gmv' else '销量'}TOP10（{tr}）："]
        for i, it in enumerate(items[:10], start=1):
            lines.append(f"{i}）{it.get('name')}｜¥{it.get('gmv')}｜{it.get('sales')}件；")
        candidates: list[Candidate] = []
        for it in items[:10]:
            candidates.append(
                {
                    "type": "product",
                    "productId": int(it.get("productId") or 0),
                    "name": str(it.get("name") or ""),
                    "sales": int(it.get("sales") or 0),
                    "gmv": str(it.get("gmv") or "0.00"),
                }
            )
        return {
            "pending_action": "PRODUCT_PICK",
            "candidates": candidates,
            "cards": _product_cards(items[:10]),
            "reply": "\n".join(lines) + "\n——\n回复序号可查看该商品简要分析。",
        }

    def refund_list_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查看售后。"}

        picked_refund = (state or {}).get("picked_refund")
        if isinstance(picked_refund, dict) and picked_refund.get("refundNo"):
            order_no = picked_refund.get("orderNo") or ""
            payload = tools.merchant_order_detail(token, str(order_no), request_id=request_id) if order_no else {"success": False}
            order_text = ""
            if payload.get("success", True):
                data = payload.get("data") or {}
                order = data.get("order") or {}
                order_text = f"\n订单{order.get('orderNo')}：{order.get('statusText')}｜实付¥{order.get('payAmount')}"
            return {
                "reply": f"退款单{picked_refund.get('refundNo')}｜订单{picked_refund.get('orderNo')}｜¥{picked_refund.get('amount')}｜{picked_refund.get('reason')}{order_text}"
            }

        msg = state.get("message") or ""
        tr = state.get("time_range_override") or ("last30" if ("待处理" in msg or "待审核" in msg) else "last7")
        status = "PENDING" if ("待处理" in msg or "待审核" in msg) else None
        payload = tools.merchant_refunds_list(token, status=status, time_range=tr, page=1, page_size=10, request_id=request_id)
        err = _error_reply(payload, "暂无售后记录。")
        if err:
            return err
        data = payload.get("data") or {}
        items = data.get("items") or []
        if not items:
            return {"reply": "暂无售后/退款记录。"}
        candidates: list[Candidate] = []
        lines = ["售后/退款列表（回复序号可查看详情）："]
        for i, it in enumerate(items, start=1):
            candidates.append(
                {
                    "type": "refund",
                    "refundNo": str(it.get("refundNo") or ""),
                    "orderNo": str(it.get("orderNo") or ""),
                    "amount": str(it.get("amount") or ""),
                    "reason": str(it.get("reason") or ""),
                }
            )
            lines.append(
                f"{i}）退款单{it.get('refundNo')}｜订单{it.get('orderNo')}｜{it.get('status')}｜¥{it.get('amount')}｜{it.get('reason')}；"
            )
        return {"pending_action": "REFUND_PICK", "candidates": candidates, "cards": _refund_cards(items), "reply": "\n".join(lines)}

    def refund_summary_flow(state: GraphState) -> dict[str, Any]:
        token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not token:
            return {"reply": "缺少登录token，无法查看退款。"}

        msg = state.get("message") or ""
        if state.get("time_range_override"):
            tr = state["time_range_override"]
        else:
            if not _has_explicit_time_range(msg):
                return _ask_time_range("REFUND_SUMMARY")
            tr = _time_range_from_text(msg, default="last7")
        payload = tools.merchant_refunds_summary(token, time_range=tr, request_id=request_id)
        err = _error_reply(payload, "暂无退款数据。")
        if err:
            return err
        data = payload.get("data") or {}
        reasons = data.get("topReasons") or []
        reason_text = "、".join(f"{r.get('reason')}({r.get('count')})" for r in reasons if isinstance(r, dict) and r.get("reason"))
        reply = (
            f"退款概览（{tr}）：{data.get('refundCount', 0)}单，¥{data.get('refundAmount') or '0.00'}，退款率{float(data.get('refundRate') or 0)*100:.1f}%。"
            + (f"\n原因TOP：{reason_text}" if reason_text else "")
        )
        return {"reply": reply}

    def other_flow(state: GraphState) -> dict[str, Any]:
        return {
            "reply": "你可以问我：今日概览、经营诊断、待处理订单、待发货订单、订单详情、库存风险、库存可售天数、销售趋势、热销排行、退款概览/列表、合规/话术、转化优化建议、药品列表/查看/上架/下架/删除。"
        }

    def route(state: GraphState) -> str:
        intent = state.get("intent") or _classify_intent(state.get("message") or "")
        if intent == "SHOP_OVERVIEW":
            return "overview_flow"
        if intent == "DIAGNOSIS":
            return "diagnosis_flow"
        if intent == "DASHBOARD_SUMMARY":
            return "dashboard_flow"
        if intent == "INVENTORY_RISK":
            return "inventory_flow"
        if intent == "INVENTORY_FORECAST":
            return "inventory_forecast_flow"
        if intent == "CONVERSION_ADVICE":
            return "conversion_flow"
        if intent == "MEDICINE_MGMT":
            return "medicine_flow"
        if intent == "ORDERS_PENDING":
            return "orders_pending_flow"
        if intent == "ORDERS_LIST":
            return "orders_list_flow"
        if intent == "ORDER_DETAIL":
            return "order_detail_flow"
        if intent == "SALES_TREND":
            return "sales_trend_flow"
        if intent == "TOP_PRODUCTS":
            return "top_products_flow"
        if intent == "REFUND_LIST":
            return "refund_list_flow"
        if intent == "REFUND_SUMMARY":
            return "refund_summary_flow"
        if intent == "COMPLIANCE_QA":
            return "compliance_flow"
        return "other_flow"

    graph = StateGraph(GraphState)
    graph.add_node("normalize_input", normalize_input)
    graph.add_node("handle_pending_pick", handle_pending_pick)
    graph.add_node("overview_flow", overview_flow)
    graph.add_node("diagnosis_flow", diagnosis_flow)
    graph.add_node("dashboard_flow", dashboard_flow)
    graph.add_node("inventory_flow", inventory_flow)
    graph.add_node("inventory_forecast_flow", inventory_forecast_flow)
    graph.add_node("conversion_flow", conversion_flow)
    graph.add_node("medicine_flow", medicine_flow)
    graph.add_node("orders_pending_flow", orders_pending_flow)
    graph.add_node("orders_list_flow", orders_list_flow)
    graph.add_node("order_detail_flow", order_detail_flow)
    graph.add_node("sales_trend_flow", sales_trend_flow)
    graph.add_node("top_products_flow", top_products_flow)
    graph.add_node("refund_list_flow", refund_list_flow)
    graph.add_node("refund_summary_flow", refund_summary_flow)
    graph.add_node("compliance_flow", compliance_flow)
    graph.add_node("other_flow", other_flow)

    graph.set_entry_point("normalize_input")
    graph.add_edge("normalize_input", "handle_pending_pick")
    graph.add_conditional_edges(
        "handle_pending_pick",
        route,
        {
            "overview_flow": "overview_flow",
            "diagnosis_flow": "diagnosis_flow",
            "dashboard_flow": "dashboard_flow",
            "inventory_flow": "inventory_flow",
            "inventory_forecast_flow": "inventory_forecast_flow",
            "conversion_flow": "conversion_flow",
            "medicine_flow": "medicine_flow",
            "orders_pending_flow": "orders_pending_flow",
            "orders_list_flow": "orders_list_flow",
            "order_detail_flow": "order_detail_flow",
            "sales_trend_flow": "sales_trend_flow",
            "top_products_flow": "top_products_flow",
            "refund_list_flow": "refund_list_flow",
            "refund_summary_flow": "refund_summary_flow",
            "compliance_flow": "compliance_flow",
            "other_flow": "other_flow",
        },
    )
    graph.add_edge("overview_flow", END)
    graph.add_edge("diagnosis_flow", END)
    graph.add_edge("dashboard_flow", END)
    graph.add_edge("inventory_flow", END)
    graph.add_edge("inventory_forecast_flow", END)
    graph.add_edge("conversion_flow", END)
    graph.add_edge("medicine_flow", END)
    graph.add_edge("orders_pending_flow", END)
    graph.add_edge("orders_list_flow", END)
    graph.add_edge("order_detail_flow", END)
    graph.add_edge("sales_trend_flow", END)
    graph.add_edge("top_products_flow", END)
    graph.add_edge("refund_list_flow", END)
    graph.add_edge("refund_summary_flow", END)
    graph.add_edge("compliance_flow", END)
    graph.add_edge("other_flow", END)
    return graph.compile()
