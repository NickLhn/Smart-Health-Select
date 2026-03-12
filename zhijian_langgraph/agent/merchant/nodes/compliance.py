"""商家端合规话术节点."""

from __future__ import annotations

from typing import Any

from agent.merchant.states import MerchantGraphState


def compliance_flow_node(state: MerchantGraphState) -> dict[str, Any]:
    """合规话术建议."""
    msg = (state.get("message") or "").strip()
    
    # 违禁词/敏感词
    if any(k in msg for k in ["违禁词", "敏感词", "广告法"]):
        return {
            "reply": "\n".join([
                "合规提示（常见高风险表达）：",
                "1）绝对化：最/第一/顶级/全网最低/100%等。",
                "2）疗效承诺：治愈/根治/立刻见效/包好/不复发等。",
                "3）医疗背书：医生推荐/权威认证（无资质证明）等。",
                "4）处方药宣传：面向公众推广处方药功效属于高风险。",
                "建议：改为客观描述（成分/规格/适用范围/用法用量），避免承诺性词汇。",
            ])
        }
    
    # 售后话术
    if "话术" in msg and any(k in msg for k in ["售后", "退款", "退货", "差评"]):
        return {
            "reply": "\n".join([
                "售后话术模板（可直接复制）：",
                "1）先共情：非常抱歉给你带来不便，我们理解你的着急。",
                "2）给方案：我这边优先为你处理：①补发/换货 ②退款 ③延迟补偿（按平台规则）。",
                "3）要信息：麻烦提供订单号/问题照片/期望处理方式，我马上跟进。",
                "4）定时回访：我会在X小时内给你明确处理结果，如未解决你可以直接回复我。",
            ])
        }
    
    # 默认
    return {
        "reply": "你可以问我：广告法违禁词有哪些、处方药宣传注意事项、售后退款/差评回复话术。也可以把你的标题/详情文案发我，我帮你改成更合规的表达。"
    }
