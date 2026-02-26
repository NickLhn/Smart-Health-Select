from __future__ import annotations

import re
from typing import Any, Literal, Optional, TypedDict

from langgraph.graph import END, StateGraph

from agent.settings import Settings
from agent.tools_client import ToolsClient

Intent = Literal["ORDER", "REFUND", "SHIPPING", "MEDICAL", "MEDICINE", "PURCHASE", "OTHER"]

class Candidate(TypedDict, total=False):
    selectKey: str
    orderNo: str
    medicineId: int
    name: str


class GraphState(TypedDict, total=False):
    message: str
    token: str
    request_id: Optional[str]
    intent: Intent
    pending_action: str | None
    candidates: list[Candidate]
    order_no: str
    purchase_draft: dict[str, Any] | None
    last_medicine_id: int | None
    reply: str
    cards: list[dict[str, Any]]
    action: dict[str, Any] | None


_ORDER_NO_RE = re.compile(r"(?<!\d)\d{18,25}(?!\d)")


def _extract_order_no(text: str) -> Optional[str]:
    match = _ORDER_NO_RE.search(text or "")
    if not match:
        return None
    return match.group(0)


def _extract_pick_index(text: str) -> Optional[int]:
    text = (text or "").strip()
    if not text.isdigit():
        return None
    try:
        value = int(text)
    except ValueError:
        return None
    if value <= 0:
        return None
    return value


def _classify_intent(text: str) -> Intent:
    text = text or ""
    if any(k in text for k in ["药品列表", "药品库", "搜索药品", "查药品", "查询药品", "查看药品", "药品详情"]):
        return "MEDICINE"
    if any(text.strip().startswith(k) for k in ["查看 ", "上架 ", "下架 ", "删除 "]):
        if any(k in text for k in ["药品", "商品"]):
            return "MEDICINE"
    if re.search(r"(?:^|[\s，。！？,.!?\-])(?:帮我|请|我要|我想)?\s*(?:下单|购买|买)\s*[\u4e00-\u9fa5A-Za-z0-9]", text):
        return "PURCHASE"
    if "退款" in text:
        return "REFUND"
    if "物流" in text or "配送" in text:
        return "SHIPPING"
    if (
        "用药" in text
        or "药" in text
        or "头疼" in text
        or "发烧" in text
        or "感冒" in text
        or "咳嗽" in text
        or "腹泻" in text
        or "创可贴" in text
        or "纱布" in text
        or "扭伤" in text
        or "崴脚" in text
        or "拉伤" in text
    ):
        return "MEDICAL"
    if "订单" in text or _extract_order_no(text):
        return "ORDER"
    return "OTHER"


def build_graph(settings: Settings):
    tools = ToolsClient(settings)

    def mask_phone(value: Any) -> str:
        if value is None:
            return ""
        text = str(value).strip()
        if len(text) < 7:
            return text
        return f"{text[:3]}****{text[-4:]}"

    def is_confirm_text(text: str) -> bool:
        t = (text or "").strip().lower()
        return t in {"1", "确认", "确认下单", "是", "好的", "好", "可以", "ok", "okay"}

    def is_cancel_text(text: str) -> bool:
        t = (text or "").strip().lower()
        return t in {"0", "取消", "取消下单", "否", "不", "不要", "算了"}

    def fmt_value(value: Any, default: str = "暂无") -> str:
        if value is None:
            return default
        if isinstance(value, str) and not value.strip():
            return default
        return str(value)

    def has_value(value: Any) -> bool:
        if value is None:
            return False
        if isinstance(value, str):
            return bool(value.strip())
        return True

    def _extract_pick_index_any(text: str) -> Optional[int]:
        m = re.search(r"\b(\d{1,2})\b", (text or "").strip())
        if not m:
            return None
        try:
            v = int(m.group(1))
        except ValueError:
            return None
        return v if v > 0 else None

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

    def _resolve_medicine_id_from_index(state: GraphState, idx: int) -> Optional[int]:
        candidates = state.get("candidates") or []
        if idx <= 0 or idx > len(candidates):
            return None
        picked = candidates[idx - 1]
        try:
            return int(picked.get("medicineId"))
        except (TypeError, ValueError):
            return None

    def _medicine_status_text(value: Any) -> str:
        try:
            v = int(value)
        except (TypeError, ValueError):
            return fmt_value(value, default="未知")
        return "上架" if v == 1 else ("下架" if v == 0 else str(v))

    def mask_txid(value: Any) -> Any:
        if value is None:
            return None
        if not isinstance(value, str):
            return value
        text = value.strip()
        if len(text) <= 12:
            return text
        return f"{text[:6]}...{text[-4:]}"

    def refund_payment_status_text(value: Any) -> str:
        try:
            status = int(value)
        except (TypeError, ValueError):
            return fmt_value(value, default="未知")
        mapping = {0: "未支付", 1: "支付成功", 2: "支付失败", 3: "已退款"}
        return mapping.get(status, str(status))

    def order_next_step_text(order: dict[str, Any]) -> str:
        try:
            status = int(order.get("status"))
        except (TypeError, ValueError):
            return ""
        mapping: dict[int, str] = {
            0: "待支付：请尽快完成支付，超时订单可能自动取消。",
            1: "待发货：商家正在配货/出库，发货后可在物流跟踪里查看配送进度。",
            2: "待收货：可发送“查物流 订单号”查看配送状态与轨迹。",
            3: "已完成：如有售后需求可发“查退款 订单号”查看退款进度。",
            4: "售后中：可发送“查退款 订单号”查看退款进度与退款流水。",
            5: "已退款：可发送“查退款 订单号”查看退款进度与退款流水。",
            6: "已取消：可重新下单。",
            7: "待审核：请耐心等待审核结果，审核通过后会继续发货流程。",
            8: "待揽收：骑手/快递正在揽收中，可稍后再查物流。",
            10: "待支付：请尽快完成支付，超时订单可能自动取消。",
            20: "待接单：商家正在接单配货中，可稍后再查订单或物流。",
            30: "配货中：商家正在配货/出库，发货后可在物流跟踪里查看配送进度。",
            40: "配送中：可发送“查物流 订单号”查看配送状态与轨迹。",
            50: "已完成：如有售后需求可发“查退款 订单号”查看退款进度。",
            60: "已取消：可重新下单。",
            70: "已退款：可发送“查退款 订单号”查看退款进度与退款流水。",
        }
        pharmacist = int(order.get("pharmacistAuditStatus") or 0)
        if pharmacist == 1:
            return "药师审核中：处方药需要药师审核通过后才能发货，请耐心等待。"
        if pharmacist == 3:
            return "药师审核未通过：请检查处方信息或更换药品后重新下单。"
        return mapping.get(status, "")

    def refund_next_step_text(refund_apply: dict[str, Any], summary: dict[str, Any]) -> str:
        try:
            status = int(refund_apply.get("status"))
        except (TypeError, ValueError):
            return ""
        if status == 0:
            return "审核中：请耐心等待商家审核，审核通过后会发起退款出账。"
        if status == 1:
            if summary.get("isRefunded"):
                return "已退款：款项已原路退回，到账时间以支付渠道为准。"
            return "审核通过：退款处理中，出账后会显示退款流水与出账时间。"
        if status == 2:
            return "审核拒绝：可根据拒绝原因修改后重新申请，或联系客服处理。"
        return ""

    def flow_error_reply(payload: dict[str, Any], not_found_reply: str) -> Optional[dict[str, Any]]:
        if payload.get("success", True):
            return None
        status_code = payload.get("status_code")
        if status_code == 404:
            return {"reply": not_found_reply}
        return {"reply": "工具服务暂时不可用，请稍后再试。"}

    def normalize_input(state: GraphState) -> dict[str, Any]:
        message = state.get("message") or ""
        pending_action = state.get("pending_action")
        pick_idx = _extract_pick_index(message)
        extracted_order_no = _extract_order_no(message)
        updates: dict[str, Any] = {"message": message}
        if pending_action == "PURCHASE_CONFIRM":
            updates["intent"] = "PURCHASE"
        elif pending_action in {"ORDER_PICK", "REFUND_PICK", "SHIPPING_PICK"} and (
            pick_idx is not None or extracted_order_no is not None
        ):
            if pending_action == "ORDER_PICK":
                updates["intent"] = "ORDER"
            elif pending_action == "REFUND_PICK":
                updates["intent"] = "REFUND"
            else:
                updates["intent"] = "SHIPPING"
        else:
            purchase_terms = ["下单", "购买", "怎么买", "加入购物车", "结算", "付款", "支付"]
            if (
                any(t in message for t in purchase_terms)
                and "订单" not in message
                and "退款" not in message
                and "物流" not in message
                and "配送" not in message
                and extracted_order_no is None
            ):
                detected = "PURCHASE"
            else:
                detected = _classify_intent(message)
            prev_intent = state.get("intent")
            if prev_intent == "MEDICAL" and detected == "OTHER":
                if "订单" in message or "退款" in message or "物流" in message or "配送" in message or extracted_order_no:
                    updates["intent"] = detected
                else:
                    updates["intent"] = "MEDICAL"
            else:
                updates["intent"] = detected
        if extracted_order_no:
            updates["order_no"] = extracted_order_no
            if pending_action in {"ORDER_PICK", "REFUND_PICK", "SHIPPING_PICK"}:
                updates["pending_action"] = None
                updates["candidates"] = []
        return updates

    def handle_pending_pick(state: GraphState) -> dict[str, Any]:
        pending_action = state.get("pending_action")
        if pending_action not in {"ORDER_PICK", "REFUND_PICK", "SHIPPING_PICK"}:
            return {}
        candidates = state.get("candidates") or []
        idx = _extract_pick_index(state.get("message") or "")
        if idx is None:
            return {}
        if idx > len(candidates):
            return {}
        picked = candidates[idx - 1]
        order_no = picked.get("orderNo") or picked.get("selectKey")
        if order_no:
            return {"order_no": str(order_no), "pending_action": None, "candidates": []}
        return {}

    def order_flow(state: GraphState) -> dict[str, Any]:
        user_token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not user_token:
            return {"reply": "缺少登录token，无法查询订单。"}
        if state.get("pending_action") == "ORDER_PICK":
            idx = _extract_pick_index(state.get("message") or "")
            candidates = state.get("candidates") or []
            if idx is not None and candidates and idx > len(candidates):
                return {"reply": f"序号无效，请输入 1-{len(candidates)}。"}
        order_no = state.get("order_no")
        if order_no:
            payload = tools.get_order_detail(user_token, order_no, request_id=request_id)
            err = flow_error_reply(payload, "未找到该订单。")
            if err:
                return err
            data = payload.get("data") or {}
            order = data.get("order") or {}
            items = data.get("items") or []
            lines = [
                f"订单号：{fmt_value(order.get('orderNo'))}",
                f"状态：{fmt_value(order.get('statusText'))}",
                f"应付：{fmt_value(order.get('totalAmount'))}",
                f"优惠：{fmt_value(order.get('couponAmount'), default='0')}",
                f"实付：{fmt_value(order.get('payAmount'))}",
                f"下单时间：{fmt_value(order.get('createTime'))}",
                f"支付时间：{fmt_value(order.get('paymentTime'))}",
                f"发货时间：{fmt_value(order.get('deliveryTime'))}",
                f"完成时间：{fmt_value(order.get('finishTime'))}",
                f"收货人：{fmt_value(order.get('receiverName'))}",
                f"电话：{fmt_value(order.get('receiverPhoneMasked'))}",
                f"地址：{fmt_value(order.get('receiverAddressMasked'))}",
            ]
            if has_value(order.get("pickupCode")):
                lines.append(f"取货码：{fmt_value(order.get('pickupCode'))}")
            if has_value(order.get("receiveCode")):
                lines.append(f"收货码：{fmt_value(order.get('receiveCode'))}")
            if has_value(order.get("refundReason")):
                lines.append(f"退款原因：{fmt_value(order.get('refundReason'))}")
            tip = order_next_step_text(order)
            if tip:
                lines.append(f"提示：{tip}")
            if items:
                lines.append("商品：")
                for it in items[:5]:
                    lines.append(
                        f"- {fmt_value(it.get('name'))} ×{fmt_value(it.get('quantity'))}（小计 {fmt_value(it.get('totalPrice'))}）"
                    )
            return {"reply": "\n".join(lines)}

        payload = tools.get_recent_orders(user_token, limit=5, request_id=request_id)
        err = flow_error_reply(payload, "暂时没有查到你的订单。")
        if err:
            return err
        items = (payload.get("data") or {}).get("items") or []
        if not items:
            return {"reply": "暂时没有查到你的订单。"}

        candidates = []
        lines = ["我需要你选择要查询的订单（回复序号即可，也可以直接回复订单号）："]
        for i, it in enumerate(items, start=1):
            lines.append(f"{i}）{it.get('displayTitle')}｜下单 {fmt_value(it.get('createTime'))}")
            candidates.append({"selectKey": it.get("selectKey"), "orderNo": it.get("selectKey")})
        return {"pending_action": "ORDER_PICK", "candidates": candidates, "reply": "\n".join(lines)}

    def refund_flow(state: GraphState) -> dict[str, Any]:
        user_token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not user_token:
            return {"reply": "缺少登录token，无法查询退款。"}
        if state.get("pending_action") == "REFUND_PICK":
            idx = _extract_pick_index(state.get("message") or "")
            candidates = state.get("candidates") or []
            if idx is not None and candidates and idx > len(candidates):
                return {"reply": f"序号无效，请输入 1-{len(candidates)}。"}
        order_no = state.get("order_no")
        if order_no:
            payload = tools.get_refund_status(user_token, order_no, request_id=request_id)
            err = flow_error_reply(payload, "未找到该订单或退款申请。")
            if err:
                return err
            data = payload.get("data") or {}
            refund_apply = data.get("refundApply") or {}
            summary = data.get("summary") or {}
            lines = [
                f"订单号：{fmt_value(refund_apply.get('orderNo'))}",
                f"退款申请状态：{fmt_value(refund_apply.get('statusText'))}",
                f"申请退款金额：{fmt_value(refund_apply.get('amount'))}",
                f"退款原因：{fmt_value(refund_apply.get('reason'))}",
                f"审核时间：{fmt_value(refund_apply.get('auditTime'))}",
                f"审核备注：{fmt_value(refund_apply.get('auditReason'))}",
                f"已退款：{'是' if summary.get('isRefunded') else '否'}",
                f"已退金额：{fmt_value(summary.get('refundedAmount'), default='0')}",
                f"退款出账时间：{fmt_value(summary.get('refundedAt'))}",
            ]
            refund_payments = data.get("refundPayments") or []
            if refund_payments:
                lines.append("退款流水：")
                for pay in refund_payments[:5]:
                    lines.append(
                        "｜".join(
                            [
                                f"- 时间：{fmt_value(pay.get('createTime'))}",
                                f"金额：{fmt_value(pay.get('amount'), default='0')}",
                                f"状态：{refund_payment_status_text(pay.get('status'))}",
                                f"流水号：{fmt_value(mask_txid(pay.get('transactionId')))}",
                            ]
                        )
                    )
            tip = refund_next_step_text(refund_apply, summary)
            if tip:
                lines.append(f"提示：{tip}")
            return {"reply": "\n".join(lines)}

        payload = tools.get_recent_refunds(user_token, limit=3, request_id=request_id)
        err = flow_error_reply(payload, "暂时没有查到你的退款记录。")
        if err:
            return err
        items = (payload.get("data") or {}).get("items") or []
        if not items:
            return {"reply": "暂时没有查到你的退款记录。"}

        candidates = []
        lines = ["我需要你选择要查询的退款记录（回复序号即可）："]
        for i, it in enumerate(items, start=1):
            lines.append(f"{i}）{it.get('displayTitle')}")
            candidates.append({"selectKey": it.get("selectKey"), "orderNo": it.get("orderNo")})
        return {"pending_action": "REFUND_PICK", "candidates": candidates, "reply": "\n".join(lines)}

    def shipping_flow(state: GraphState) -> dict[str, Any]:
        user_token = state.get("token") or ""
        request_id = state.get("request_id") or None
        if not user_token:
            return {"reply": "缺少登录token，无法查询物流。"}
        if state.get("pending_action") == "SHIPPING_PICK":
            idx = _extract_pick_index(state.get("message") or "")
            candidates = state.get("candidates") or []
            if idx is not None and candidates and idx > len(candidates):
                return {"reply": f"序号无效，请输入 1-{len(candidates)}。"}
        order_no = state.get("order_no")
        if order_no:
            payload = tools.get_shipping_status(user_token, order_no, request_id=request_id)
            err = flow_error_reply(payload, "未找到该订单或配送信息。")
            if err:
                return err
            data = payload.get("data") or {}
            delivery = data.get("delivery") or {}
            lines = [
                f"订单号：{fmt_value(delivery.get('orderNo'))}",
                f"配送状态：{fmt_value(delivery.get('statusText'))}",
                f"订单状态：{fmt_value(delivery.get('orderStatusText'))}",
                f"店铺：{fmt_value(delivery.get('shopName'))}",
                f"店铺地址：{fmt_value(delivery.get('shopAddress'))}",
                f"骑手：{fmt_value(delivery.get('courierName'))}",
                f"骑手电话：{fmt_value(delivery.get('courierPhoneMasked'))}",
                f"收货人：{fmt_value(delivery.get('receiverName'))}",
                f"收货电话：{fmt_value(delivery.get('receiverPhoneMasked'))}",
                f"收货地址：{fmt_value(delivery.get('receiverAddressMasked'))}",
                f"配送费：{fmt_value(delivery.get('deliveryFee'))}",
                f"异常原因：{fmt_value(delivery.get('exceptionReason'))}",
                f"更新时间：{fmt_value(delivery.get('updateTime'))}",
            ]
            if int(delivery.get("isUrgent") or 0) == 1:
                lines.append("提示：该订单为急单，配送会优先处理。")
            if has_value(delivery.get("verifyCode")):
                lines.append(f"签收验证码：{fmt_value(delivery.get('verifyCode'))}")
            if has_value(delivery.get("proofImageUrl")):
                lines.append(f"送达凭证：{fmt_value(delivery.get('proofImageUrl'))}")
            track = delivery.get("track") or []
            if isinstance(track, list) and track:
                lines.append("配送轨迹：")
                for node in track[:8]:
                    if not isinstance(node, dict):
                        continue
                    lines.append(f"- {fmt_value(node.get('time'))} {fmt_value(node.get('text'))}")
            return {"reply": "\n".join(lines)}

        payload = tools.get_recent_shipping(user_token, limit=5, request_id=request_id)
        err = flow_error_reply(payload, "暂时没有查到可跟踪的配送订单。")
        if err:
            return err
        items = (payload.get("data") or {}).get("items") or []
        if not items:
            return {"reply": "暂时没有查到可跟踪的配送订单。"}

        candidates = []
        lines = ["我需要你选择要查询的配送订单（回复序号即可）："]
        for i, it in enumerate(items, start=1):
            lines.append(f"{i}）{it.get('displayTitle')}")
            candidates.append({"selectKey": it.get("selectKey"), "orderNo": it.get("selectKey")})
        return {"pending_action": "SHIPPING_PICK", "candidates": candidates, "reply": "\n".join(lines)}

    def medical_flow(state: GraphState) -> dict[str, Any]:
        user_token = state.get("token") or ""
        request_id = state.get("request_id") or None
        message = state.get("message") or ""
        if not user_token:
            return {"reply": "缺少登录token，无法进行用药推荐。"}

        emergency_keywords = ["胸痛", "呼吸困难", "意识模糊", "抽搐", "持续高热", "呕血", "便血", "剧烈腹痛"]
        if any(k in message for k in emergency_keywords):
            return {"reply": "你的描述可能存在紧急风险，建议立即就医或拨打急救电话。若方便，请补充：年龄、体温、症状持续时间、既往病史与过敏史。"}

        if "创可贴" in message and ("怎么用" in message or "如何" in message or "使用" in message or "贴" in message):
            payload = tools.search_medicines(user_token, "创可贴", limit=5, request_id=request_id)
            items = (payload.get("data") or {}).get("items") if payload.get("success", True) else []
            cards = items if isinstance(items, list) else []
            reply_lines = [
                "创可贴一般这样用：",
                "- 先洗手，清水冲洗伤口，必要时用碘伏等消毒（避免把消毒液灌进深口）。",
                "- 轻轻擦干伤口周围皮肤，让皮肤保持干燥。",
                "- 撕开包装，避免手指触碰中间吸收垫；将吸收垫对准伤口贴上。",
                "- 贴好后按压两侧胶布固定；若浸湿/变脏/松脱请及时更换。",
                "",
                "注意：",
                "- 伤口较深、持续出血、明显红肿流脓、动物咬伤/脏污伤口，建议就医处理。",
                "- 对胶布过敏、皮肤破溃范围大，尽量改用纱布敷料。",
            ]
            return {"reply": "\n".join(reply_lines), "cards": cards[:5]}

        injury_keywords = ["扭伤", "崴脚", "脚扭", "脚踝", "拉伤", "扭了"]
        if any(k in message for k in injury_keywords):
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

            reply_lines = [
                "关于脚踝/脚部扭伤（崴脚），可以先这样处理：",
                "- 休息：减少负重与活动，必要时使用拐杖/护踝固定。",
                "- 冰敷：受伤后 24-48 小时内，每次 15-20 分钟，每天多次（不要直接冰贴皮肤）。",
                "- 加压：弹力绷带适度加压包扎（避免过紧导致发麻/发紫）。",
                "- 抬高：抬高患肢，帮助消肿。",
                "",
                "建议尽快就医/拍片的情况：",
                "- 不能站立负重、疼痛明显加重、明显畸形、麻木发凉、肿胀迅速加重，或 48 小时仍明显恶化。",
            ]
            if cards:
                reply_lines.extend(["", "为你匹配到以下可能相关的用品/药品（点击可查看详情）："])
            return {"reply": "\n".join(reply_lines), "cards": cards}

        normalized = re.sub(r"[\s,，。.!！?？;；:：、/\\()\[\]{}<>\"'“”‘’\-_=+~`|@#$%^&*]", "", message)
        if len(normalized) < 4:
            return {"reply": "请补充信息：年龄、主要症状（如发热/咳嗽/腹泻/头痛等）、是否发热及体温、过敏史、是否怀孕/哺乳、正在使用的药物。"}

        explicit_terms = [
            "布洛芬",
            "对乙酰氨基酚",
            "阿莫西林",
            "头孢",
            "奥美拉唑",
            "多潘立酮",
            "盐酸氨溴索",
            "复方甘草片",
            "连花清瘟",
            "板蓝根",
            "藿香正气",
            "孟鲁司特",
            "硝苯地平",
            "阿托伐他汀",
            "硝酸甘油",
            "创可贴",
            "医用纱布",
            "电子体温计",
            "电子血压计",
            "血糖仪",
        ]
        keywords: list[str] = []
        for t in explicit_terms:
            if t in message:
                keywords.append(t)

        symptom_map: list[tuple[list[str], list[str]]] = [
            (["发热", "发烧", "感冒", "流感", "嗓子疼", "咽痛"], ["对乙酰氨基酚", "布洛芬", "连花清瘟", "板蓝根"]),
            (["头痛", "牙痛", "痛经", "关节痛", "偏头痛"], ["布洛芬", "对乙酰氨基酚"]),
            (["咳嗽", "咳痰", "痰多"], ["盐酸氨溴索", "复方甘草片"]),
            (["胃痛", "反酸", "烧心", "胃胀", "恶心", "呕吐"], ["奥美拉唑", "多潘立酮"]),
            (["腹泻", "腹痛", "肠胃炎"], ["藿香正气"]),
            (["高血压", "血压高", "心绞痛", "胸闷"], ["硝苯地平", "硝酸甘油", "电子血压计"]),
            (["血脂高", "胆固醇高"], ["阿托伐他汀"]),
            (["扭伤", "崴脚", "脚扭", "脚踝", "拉伤", "跌打", "扭了"], ["布洛芬", "对乙酰氨基酚", "医用纱布", "创可贴"]),
        ]

        for triggers, terms in symptom_map:
            if any(t in message for t in triggers):
                keywords.extend(terms)

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
                "reply": "\n".join(
                    [
                        "我先给你一些通用建议：",
                        "- 如果有过敏史、孕哺期、儿童、慢病用药或症状较重，请优先咨询医生/药师。",
                        "- 用药前请核对说明书：适应症/禁忌/用法用量，避免重复成分叠加。",
                        "- 若高热不退、呼吸困难、胸痛、意识异常等，请及时就医。",
                        "",
                        "目前暂时没匹配到可推荐的具体商品，你可以换个关键词（药品名/症状）或补充：体温、是否咳嗽咳痰、症状持续时间、过敏史、是否孕哺、正在使用的药物。",
                    ]
                ),
                "cards": [],
            }

        reply_lines = [
            "我先给你一些通用建议：",
            "- 如果有过敏史、孕哺期、儿童、慢病用药或症状较重，请优先咨询医生/药师。",
            "- 用药前请核对说明书：适应症/禁忌/用法用量，避免重复成分叠加。",
            "- 若高热不退、呼吸困难、胸痛、意识异常等，请及时就医。",
            "",
            "为你匹配到以下可能相关的药品（点击可查看详情）：",
        ]
        return {"reply": "\n".join(reply_lines), "cards": cards}

    def medicine_flow(state: GraphState) -> dict[str, Any]:
        user_token = state.get("token") or ""
        request_id = state.get("request_id") or None
        message = (state.get("message") or "").strip()
        if not user_token:
            return {"reply": "缺少登录token，无法查询药品。"}

        if any(message.startswith(k) for k in ["上架", "下架", "删除"]):
            return {"reply": "用户端无权操作上架/下架/删除。如需购买请说“购买 + 药品名”，或前往商品详情页下单。"}

        idx = _extract_pick_index_any(message)
        medicine_id = _extract_medicine_id(message)
        if medicine_id is None and idx is not None:
            medicine_id = _resolve_medicine_id_from_index(state, idx)
        if medicine_id is None:
            medicine_id = state.get("last_medicine_id")

        if any(k in message for k in ["药品列表", "药品库", "搜索药品", "查药品", "查询药品"]):
            keyword = re.sub(r"^(药品列表|药品库|搜索药品|查药品|查询药品)\s*", "", message).strip()
            if not keyword:
                keyword = None
            payload = tools.medicines_list(user_token, keyword=keyword, page=1, size=10, request_id=request_id)
            if not payload.get("success", True):
                return {"reply": "查询失败，请稍后再试。"}
            data = payload.get("data") or {}
            records = data.get("records") or []
            total = data.get("total") or 0
            if not isinstance(records, list) or not records:
                return {"reply": "没有找到匹配的药品。"}

            candidates: list[Candidate] = []
            lines = [f"共 {int(total)} 条药品（展示前 10 条）："]
            for i, r in enumerate(records[:10], start=1):
                if not isinstance(r, dict):
                    continue
                mid = r.get("id")
                name = r.get("name") or "-"
                price = r.get("price")
                stock = r.get("stock")
                st = _medicine_status_text(r.get("status"))
                candidates.append({"medicineId": int(mid or 0), "name": str(name)})
                lines.append(f"{i}. 药品ID={mid} 名称={name} 状态={st} 价格={price} 库存={stock}")
            lines.append("可输入：查看 1 / 购买 药品ID=xx")
            return {"candidates": candidates, "reply": "\n".join(lines)}

        if message.startswith("查看") or "药品详情" in message:
            if medicine_id is None:
                return {"reply": "请提供药品ID或列表序号，例如：查看 1 或 查看 药品id=25。"}
            payload = tools.medicine_detail(user_token, medicine_id=medicine_id, request_id=request_id)
            if not payload.get("success", True):
                return {"reply": "未找到该药品（可能已下架）。"}
            data = payload.get("data") or {}
            if not isinstance(data, dict) or not data:
                return {"reply": "未找到该药品（可能已下架）。"}
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
            if data.get("mainImage"):
                lines.append(f"主图：{data.get('mainImage')}")
            lines.append(f"你可以说：购买 药品ID={medicine_id}")
            return {"last_medicine_id": medicine_id, "reply": "\n".join(lines)}

        return {"reply": "可用指令示例：\n- 药品列表\n- 搜索药品 布洛芬\n- 查看 1\n- 购买 药品ID=25"}

    def purchase_flow(state: GraphState) -> dict[str, Any]:
        user_token = state.get("token") or ""
        request_id = state.get("request_id") or None
        message = state.get("message") or ""
        if not user_token:
            return {"reply": "缺少登录token，无法下单。"}

        def extract_purchase_keyword(text: str) -> Optional[str]:
            txt = (text or "").strip()
            m = re.search(r"(?:帮我|请|我要|我想)?\s*(?:下单|购买|买)\s*(?P<kw>.+)$", txt)
            if not m:
                return None
            kw = (m.group("kw") or "").strip()
            kw = re.sub(r"[，。！？,.!?\s]+$", "", kw)
            kw = re.sub(r"^(一个|一盒|一包|一瓶|一件|一支|两盒|两包|两瓶|两件|两支)\s*", "", kw)
            kw = kw.strip()
            if not kw:
                return None
            if kw in {"一下", "吧", "呢", "哈"}:
                return None
            return kw[:40]

        if state.get("pending_action") == "PURCHASE_CONFIRM":
            user_text = state.get("message") or ""
            if is_cancel_text(user_text):
                return {
                    "intent": "PURCHASE",
                    "pending_action": None,
                    "purchase_draft": None,
                    "action": None,
                    "reply": "已取消下单。如需购买，请前往购物车结算页操作。",
                }
            if not is_confirm_text(user_text):
                return {
                    "intent": "PURCHASE",
                    "pending_action": "PURCHASE_CONFIRM",
                    "reply": "请回复 1 确认下单，或回复 0 取消。",
                }

            draft = state.get("purchase_draft") or {}
            if not isinstance(draft, dict) or not draft:
                return {
                    "intent": "PURCHASE",
                    "pending_action": None,
                    "purchase_draft": None,
                    "reply": "下单信息已失效，请重新发起下单。",
                }

            payload = tools.create_order_from_cart(user_token, draft, request_id=request_id)
            if not payload.get("success", True):
                err = payload.get("error") or ""
                if isinstance(err, str) and err:
                    if "处方药" in err and ("就诊人" in err or "处方" in err):
                        return {
                            "intent": "PURCHASE",
                            "pending_action": None,
                            "purchase_draft": None,
                            "action": {"type": "NAVIGATE", "url": "/order/checkout", "replace": False},
                            "reply": "检测到处方药下单需要补充就诊人与处方信息，已为你跳转到结算页，请在结算页补全信息后提交并支付。",
                        }
                    return {
                        "intent": "PURCHASE",
                        "pending_action": None,
                        "purchase_draft": None,
                        "reply": f"下单失败：{err}",
                    }
                return {
                    "intent": "PURCHASE",
                    "pending_action": None,
                    "purchase_draft": None,
                    "reply": "下单失败，请稍后再试或前往购物车结算页操作。",
                }

            order_ids = (payload.get("data") or {}).get("orderIds") or []
            first_id: Optional[int] = None
            if isinstance(order_ids, list) and order_ids:
                try:
                    first_id = int(order_ids[0])
                except (TypeError, ValueError):
                    first_id = None

            reply_lines = ["订单创建成功。"]
            if isinstance(order_ids, list) and order_ids:
                reply_lines.append("订单ID：" + "，".join(str(x) for x in order_ids[:10]))
            if first_id is not None:
                return {
                    "intent": "PURCHASE",
                    "pending_action": None,
                    "purchase_draft": None,
                    "action": None,
                    "reply": "\n".join(reply_lines + ["请您手动跳转到收银台进行付款。"]),
                }
            return {
                "intent": "PURCHASE",
                "pending_action": None,
                "purchase_draft": None,
                "reply": "\n".join(reply_lines),
            }
        

        cart_payload = tools.get_cart_list(user_token, request_id=request_id)
        err = flow_error_reply(cart_payload, "购物车为空。")
        if err:
            return {"intent": "PURCHASE", **err}
        cart_items = (cart_payload.get("data") or {}).get("items") or []
        if not isinstance(cart_items, list) or not cart_items:
            keyword = extract_purchase_keyword(message)
            if not keyword:
                return {"intent": "PURCHASE", "reply": "购物车为空，请先把商品加入购物车后再下单。"}

            search_payload = tools.search_medicines(user_token, keyword, limit=5, request_id=request_id)
            if not search_payload.get("success", True):
                err2 = flow_error_reply(search_payload, "暂时找不到该商品。")
                if err2:
                    return {"intent": "PURCHASE", **err2}
                return {"intent": "PURCHASE", "reply": "暂时找不到该商品，请稍后再试或前往找药页添加后下单。"}

            items = (search_payload.get("data") or {}).get("items") or []
            if not isinstance(items, list) or not items:
                return {"intent": "PURCHASE", "reply": f"暂时没有找到“{keyword}”，你可以换个关键词或前往找药页添加后下单。"}

            picked: Optional[dict[str, Any]] = None
            for it in items:
                if not isinstance(it, dict):
                    continue
                name = str(it.get("name") or it.get("medicineName") or "")
                if name and keyword in name:
                    picked = it
                    break
            if picked is None:
                first = items[0]
                picked = first if isinstance(first, dict) else None
            if picked is None:
                return {"intent": "PURCHASE", "reply": f"暂时没有找到“{keyword}”，你可以换个关键词或前往找药页添加后下单。"}

            try:
                medicine_id = int(picked.get("id"))
            except (TypeError, ValueError):
                return {"intent": "PURCHASE", "reply": "商品数据异常，请前往找药页添加后下单。"}

            add_payload = tools.add_to_cart(user_token, medicine_id, count=1, request_id=request_id)
            if not add_payload.get("success", True):
                err_text = add_payload.get("error") or ""
                if isinstance(err_text, str) and err_text:
                    return {"intent": "PURCHASE", "cards": items[:5], "reply": f"已找到“{keyword}”，但加入购物车失败：{err_text}"}
                return {"intent": "PURCHASE", "cards": items[:5], "reply": f"已找到“{keyword}”，但加入购物车失败，请稍后再试。"}

            cart_payload = tools.get_cart_list(user_token, request_id=request_id)
            err = flow_error_reply(cart_payload, "购物车为空。")
            if err:
                return {"intent": "PURCHASE", **err}
            cart_items = (cart_payload.get("data") or {}).get("items") or []
            if not isinstance(cart_items, list) or not cart_items:
                return {"intent": "PURCHASE", "reply": f"已尝试把“{keyword}”加入购物车，但购物车仍为空，请前往购物车查看后再下单。"}

        address_payload = tools.get_user_address_list(user_token, request_id=request_id)
        err = flow_error_reply(address_payload, "暂无收货地址。")
        if err:
            return {"intent": "PURCHASE", **err}
        addresses = (address_payload.get("data") or {}).get("items") or []
        if not isinstance(addresses, list) or not addresses:
            return {"intent": "PURCHASE", "reply": "你还没有收货地址，请先在“个人中心-收货地址”新增后再下单。"}

        default_addr = None
        for addr in addresses:
            if isinstance(addr, dict) and int(addr.get("isDefault") or 0) == 1:
                default_addr = addr
                break
        if default_addr is None:
            first = addresses[0]
            default_addr = first if isinstance(first, dict) else None
        if default_addr is None:
            return {"intent": "PURCHASE", "reply": "收货地址数据异常，请前往结算页操作。"}

        try:
            address_id = int(default_addr.get("id"))
        except (TypeError, ValueError):
            return {"intent": "PURCHASE", "reply": "收货地址数据异常，请前往结算页操作。"}

        cart_item_ids: list[int] = []
        total_price = 0.0
        preview_lines: list[str] = []
        for it in cart_items:
            if not isinstance(it, dict):
                continue
            try:
                cid = int(it.get("id"))
            except (TypeError, ValueError):
                continue
            cart_item_ids.append(cid)
            name = str(it.get("medicineName") or it.get("name") or "")
            try:
                count = int(it.get("count") or it.get("quantity") or 0)
            except (TypeError, ValueError):
                count = 0
            try:
                price = float(it.get("price") or 0)
            except (TypeError, ValueError):
                price = 0.0
            total_price += price * max(0, count)
            if len(preview_lines) < 5 and name:
                preview_lines.append(f"- {name} ×{count}")

        if not cart_item_ids:
            return {"intent": "PURCHASE", "reply": "购物车数据异常，请前往结算页操作。"}

        receiver = str(default_addr.get("receiverName") or "")
        phone = mask_phone(default_addr.get("receiverPhone"))
        province = str(default_addr.get("province") or "")
        city = str(default_addr.get("city") or "")
        region = str(default_addr.get("region") or "")
        detail = str(default_addr.get("detailAddress") or "")
        address_text = f"{province}{city}{region}{detail}".strip()

        lines = [
            "我可以帮你用购物车商品创建订单，并跳转到收银台。",
            f"收货人：{receiver} {phone}".strip(),
            f"地址：{address_text}" if address_text else "地址：暂无",
            f"商品数量：{len(cart_item_ids)} 件",
            f"预估金额：¥{total_price:.2f}",
        ]
        if preview_lines:
            lines.append("商品预览：")
            lines.extend(preview_lines)
        lines.append("回复 1 确认下单，或回复 0 取消。")

        return {
            "intent": "PURCHASE",
            "pending_action": "PURCHASE_CONFIRM",
            "purchase_draft": {"cartItemIds": cart_item_ids, "addressId": address_id},
            "action": None,
            "reply": "\n".join(lines),
        }

    def other_flow(state: GraphState) -> dict[str, Any]:
        return {"reply": "你可以问我：订单查询、退款进度、物流跟踪或用药咨询。"}

    def route(state: GraphState) -> str:
        intent = state.get("intent") or _classify_intent(state.get("message") or "")
        if intent == "ORDER":
            return "order_flow"
        if intent == "REFUND":
            return "refund_flow"
        if intent == "SHIPPING":
            return "shipping_flow"
        if intent == "MEDICAL":
            return "medical_flow"
        if intent == "MEDICINE":
            return "medicine_flow"
        if intent == "PURCHASE":
            return "purchase_flow"
        return "other_flow"

    graph = StateGraph(GraphState)
    graph.add_node("normalize_input", normalize_input)
    graph.add_node("handle_pending_pick", handle_pending_pick)
    graph.add_node("order_flow", order_flow)
    graph.add_node("refund_flow", refund_flow)
    graph.add_node("shipping_flow", shipping_flow)
    graph.add_node("medical_flow", medical_flow)
    graph.add_node("medicine_flow", medicine_flow)
    graph.add_node("purchase_flow", purchase_flow)
    graph.add_node("other_flow", other_flow)

    graph.set_entry_point("normalize_input")
    graph.add_edge("normalize_input", "handle_pending_pick")

    graph.add_conditional_edges(
        "handle_pending_pick",
        route,
        {
            "order_flow": "order_flow",
            "refund_flow": "refund_flow",
            "shipping_flow": "shipping_flow",
            "medical_flow": "medical_flow",
            "medicine_flow": "medicine_flow",
            "purchase_flow": "purchase_flow",
            "other_flow": "other_flow",
        },
    )

    graph.add_edge("order_flow", END)
    graph.add_edge("refund_flow", END)
    graph.add_edge("shipping_flow", END)
    graph.add_edge("medical_flow", END)
    graph.add_edge("medicine_flow", END)
    graph.add_edge("purchase_flow", END)
    graph.add_edge("other_flow", END)

    return graph.compile()
