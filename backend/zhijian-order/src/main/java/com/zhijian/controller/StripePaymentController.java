package com.zhijian.controller;

import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.dto.payment.CheckoutSessionVO;
import com.zhijian.dto.payment.CreateCheckoutSessionDTO;
import com.zhijian.dto.payment.StripeSessionStatusVO;
import com.zhijian.service.StripePaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stripe 沙盒支付控制器。
 */
@Tag(name = "Stripe 沙盒支付")
@RestController
@RequestMapping("/payments/stripe")
@RequiredArgsConstructor
public class StripePaymentController {

    private final StripePaymentService stripePaymentService;

    @Operation(summary = "创建 Stripe Checkout Session")
    @PostMapping("/checkout-session")
    public Result<CheckoutSessionVO> createCheckoutSession(@RequestBody @Valid CreateCheckoutSessionDTO dto) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return Result.success(stripePaymentService.createCheckoutSession(dto.getOrderIds(), userId));
    }

    @Operation(summary = "Stripe webhook")
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signatureHeader
    ) {
        try {
            // Stripe 只认 HTTP 状态码，不需要业务 Result 包装。
            stripePaymentService.handleWebhook(payload, signatureHeader);
            return ResponseEntity.ok("ok");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "查询 Stripe Session 状态")
    @GetMapping("/session/{sessionId}")
    public Result<StripeSessionStatusVO> getSessionStatus(@PathVariable String sessionId) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return Result.success(stripePaymentService.getSessionStatus(sessionId, userId));
    }
}
