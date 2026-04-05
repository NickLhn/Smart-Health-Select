package com.zhijian.service.impl;

import cn.hutool.core.util.RandomUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.zhijian.config.StripeProperties;
import com.zhijian.dto.payment.CheckoutSessionVO;
import com.zhijian.dto.payment.StripeSessionStatusVO;
import com.zhijian.pojo.Order;
import com.zhijian.pojo.PaymentBatch;
import com.zhijian.service.OrderService;
import com.zhijian.service.PaymentBatchService;
import com.zhijian.service.StripePaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Stripe 沙盒支付服务实现。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StripePaymentServiceImpl implements StripePaymentService {

    private static final String PROVIDER = "stripe";
    private static final Integer PAYMENT_METHOD_STRIPE = 3;
    private static final Integer BATCH_STATUS_PENDING = 0;
    private static final Integer BATCH_STATUS_PAID = 1;
    private static final Integer BATCH_STATUS_CANCELED = 2;
    private static final Integer BATCH_STATUS_EXPIRED = 3;
    private static final Integer BATCH_STATUS_FAILED = 4;

    private final StripeProperties stripeProperties;
    private final OrderService orderService;
    private final PaymentBatchService paymentBatchService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CheckoutSessionVO createCheckoutSession(List<String> orderIds, Long userId) {
        ensureStripeConfigured();

        // 先锁定这次要支付的本地订单集合，避免把已支付或串用户的订单带进 Stripe。
        List<Order> orders = validatePendingOrders(parseOrderIds(orderIds), userId);
        BigDecimal totalAmount = orders.stream()
                .map(Order::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        PaymentBatch batch = new PaymentBatch();
        batch.setBatchNo(buildBatchNo());
        batch.setUserId(userId);
        batch.setOrderIdsJson(writeOrderIds(parseOrderIds(orderIds)));
        batch.setAmount(totalAmount);
        batch.setCurrency(stripeProperties.getCurrency());
        batch.setProvider(PROVIDER);
        batch.setProviderStatus("open");
        batch.setStatus(BATCH_STATUS_PENDING);
        // 支付批次过期时间直接对齐订单支付窗口，避免本地超时和 Stripe checkout 结果页各走各的时钟。
        batch.setExpireTime(resolveBatchExpireTime(orders));
        paymentBatchService.save(batch);

        String productName = orders.size() == 1
                ? orders.get(0).getMedicineName() + " 测试支付"
                : "智健优选合并订单测试支付";

        try {
            Stripe.apiKey = stripeProperties.getSecretKey();
            // 这版先走 Stripe 托管 Checkout，前端不直接处理卡片信息，实现成本最低。
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(stripeProperties.getSuccessUrl())
                    .setCancelUrl(stripeProperties.getCancelUrl())
                    .setClientReferenceId(batch.getBatchNo())
                    .putMetadata("batchNo", batch.getBatchNo())
                    .putMetadata("userId", String.valueOf(userId))
                    // 不在代码里写死 payment_method_types，让 Stripe 按 Dashboard 的动态支付方式配置决定展示项。
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency(stripeProperties.getCurrency())
                                    .setUnitAmount(toMinorAmount(totalAmount))
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName(productName)
                                            .setDescription("Stripe sandbox checkout")
                                            .build())
                                    .build())
                            .build())
                    .build();

            Session session = Session.create(params);
            batch.setCheckoutSessionId(session.getId());
            batch.setPaymentIntentId(session.getPaymentIntent());
            batch.setProviderStatus(session.getPaymentStatus());
            batch.setRemark("Stripe sandbox checkout session created");
            paymentBatchService.updateById(batch);

            CheckoutSessionVO vo = new CheckoutSessionVO();
            vo.setBatchNo(batch.getBatchNo());
            vo.setSessionId(session.getId());
            vo.setUrl(session.getUrl());
            return vo;
        } catch (StripeException e) {
            log.error("创建 Stripe Checkout Session 失败, batchNo={}", batch.getBatchNo(), e);
            throw new RuntimeException("创建 Stripe 支付会话失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void handleWebhook(String payload, String signatureHeader) {
        ensureWebhookConfigured();
        if (!StringUtils.hasText(signatureHeader)) {
            throw new RuntimeException("缺少 Stripe-Signature 请求头");
        }

        try {
            // 所有订单状态更新都以 webhook 为准，前端跳转成功页不直接改本地订单状态。
            Event event = Webhook.constructEvent(payload, signatureHeader, stripeProperties.getWebhookSecret());
            Stripe.apiKey = stripeProperties.getSecretKey();
            Session session = deserializeSession(event, payload);
            if (session == null) {
                log.warn("无法从 Stripe webhook 中解析 Session, eventId={}, type={}", event.getId(), event.getType());
                return;
            }

            switch (event.getType()) {
                case "checkout.session.completed":
                case "checkout.session.async_payment_succeeded":
                    handlePaidSession(session, event);
                    break;
                case "checkout.session.expired":
                    updateBatchState(session.getId(), BATCH_STATUS_EXPIRED, session.getPaymentStatus(), event.getId());
                    break;
                case "checkout.session.async_payment_failed":
                    updateBatchState(session.getId(), BATCH_STATUS_FAILED, session.getPaymentStatus(), event.getId());
                    break;
                default:
                    log.info("忽略 Stripe webhook 事件: {}", event.getType());
            }
        } catch (SignatureVerificationException e) {
            throw new RuntimeException("Stripe webhook 验签失败");
        }
    }

    @Override
    public StripeSessionStatusVO getSessionStatus(String sessionId, Long userId) {
        // 成功页会轮询这个接口，兜底等待 webhook 把本地支付状态补齐。
        PaymentBatch batch = paymentBatchService.getOne(new LambdaQueryWrapper<PaymentBatch>()
                .eq(PaymentBatch::getCheckoutSessionId, sessionId)
                .eq(PaymentBatch::getUserId, userId)
                .last("LIMIT 1"));
        if (batch == null) {
            throw new RuntimeException("未找到对应的支付会话");
        }

        StripeSessionStatusVO vo = new StripeSessionStatusVO();
        vo.setSessionId(batch.getCheckoutSessionId());
        vo.setBatchNo(batch.getBatchNo());
        vo.setStatus(batch.getStatus());
        vo.setProviderStatus(batch.getProviderStatus());
        vo.setPaymentStatus(toDisplayStatus(batch.getStatus()));
        vo.setAmount(batch.getAmount());
        vo.setCurrency(batch.getCurrency());
        vo.setOrderIds(parseOrderIds(batch.getOrderIdsJson()));
        return vo;
    }

    private List<Order> validatePendingOrders(List<Long> orderIds, Long userId) {
        if (orderIds == null || orderIds.isEmpty()) {
            throw new RuntimeException("请选择要支付的订单");
        }

        List<Long> distinctOrderIds = orderIds.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .sorted()
                .toList();
        if (distinctOrderIds.isEmpty() || distinctOrderIds.size() != orderIds.size()) {
            throw new RuntimeException("支付请求中的订单ID无效: " + orderIds);
        }

        List<Order> orders = new ArrayList<>(orderService.listByIds(distinctOrderIds));
        if (orders.size() != distinctOrderIds.size()) {
            Set<Long> foundIds = orders.stream().map(Order::getId).collect(Collectors.toCollection(HashSet::new));
            List<Long> missingIds = distinctOrderIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
            throw new RuntimeException("存在无效订单，无法发起支付，缺失订单ID: " + missingIds);
        }

        orders.sort(Comparator.comparing(Order::getId));
        for (Order order : orders) {
            if (!order.getUserId().equals(userId)) {
                throw new RuntimeException("存在不属于当前用户的订单");
            }
            if (order.getStatus() != 0) {
                throw new RuntimeException("订单 " + order.getOrderNo() + " 当前状态不允许支付");
            }
            if (order.getPayExpireTime() != null && order.getPayExpireTime().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("订单 " + order.getOrderNo() + " 已超过支付时限，请刷新订单状态后重试");
            }
        }
        return orders;
    }

    private void handlePaidSession(Session session, Event event) {
        PaymentBatch batch = paymentBatchService.getOne(new LambdaQueryWrapper<PaymentBatch>()
                .eq(PaymentBatch::getCheckoutSessionId, session.getId())
                .last("LIMIT 1"));
        if (batch == null) {
            log.warn("收到未知 Stripe Session 的支付回调: sessionId={}", session.getId());
            return;
        }
        if (BATCH_STATUS_PAID.equals(batch.getStatus())) {
            // webhook 可能被重复投递，这里直接幂等返回，不重复记账、不重复加销量。
            log.info("Stripe webhook 重复到达，批次已处理: batchNo={}", batch.getBatchNo());
            return;
        }
        if (BATCH_STATUS_CANCELED.equals(batch.getStatus()) || BATCH_STATUS_EXPIRED.equals(batch.getStatus()) || BATCH_STATUS_FAILED.equals(batch.getStatus())) {
            // 本地订单已经关闭后，再收到迟到的支付成功事件时不再抛错重试，避免 webhook 长时间反复回放。
            batch.setProviderStatus(session.getPaymentStatus());
            batch.setWebhookEventId(event.getId());
            batch.setRemark("收到支付成功回调，但本地批次已关闭");
            paymentBatchService.updateById(batch);
            log.warn("Stripe 支付成功回调到达时批次已关闭, batchNo={}, status={}", batch.getBatchNo(), batch.getStatus());
            return;
        }

        String paymentIntentId = session.getPaymentIntent();
        String transactionId = StringUtils.hasText(paymentIntentId) ? paymentIntentId : session.getId();

        orderService.markOrdersPaid(
                parseOrderIds(batch.getOrderIdsJson()),
                batch.getUserId(),
                PAYMENT_METHOD_STRIPE,
                transactionId,
                PROVIDER,
                batch.getCurrency(),
                session.getId(),
                paymentIntentId,
                session.getPaymentStatus()
        );

        batch.setPaymentIntentId(paymentIntentId);
        batch.setProviderStatus(session.getPaymentStatus());
        batch.setWebhookEventId(event.getId());
        batch.setStatus(BATCH_STATUS_PAID);
        batch.setPaidTime(LocalDateTime.now());
        batch.setRemark("Stripe webhook marked batch as paid");
        paymentBatchService.updateById(batch);
    }

    private void updateBatchState(String sessionId, Integer status, String providerStatus, String eventId) {
        PaymentBatch batch = paymentBatchService.getOne(new LambdaQueryWrapper<PaymentBatch>()
                .eq(PaymentBatch::getCheckoutSessionId, sessionId)
                .last("LIMIT 1"));
        if (batch == null || BATCH_STATUS_PAID.equals(batch.getStatus())) {
            return;
        }
        // 对于过期、取消、失败等非成功状态，只更新支付批次，不去改订单主状态。
        batch.setStatus(status);
        batch.setProviderStatus(providerStatus);
        batch.setWebhookEventId(eventId);
        paymentBatchService.updateById(batch);
    }

    private Session deserializeSession(Event event, String payload) {
        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        Session session = deserializer.getObject()
                .filter(Session.class::isInstance)
                .map(Session.class::cast)
                .orElse(null);
        if (session != null) {
            return session;
        }

        // 新版 Stripe Webhook 事件在 API 版本不完全匹配时，SDK 可能拿不到反序列化对象。
        // 这里退回到 payload 里读取 sessionId，再主动从 Stripe 查询一次，保证支付回写不中断。
        String sessionId = extractSessionId(payload);
        if (!StringUtils.hasText(sessionId)) {
            return null;
        }
        try {
            return Session.retrieve(sessionId);
        } catch (StripeException e) {
            log.warn("根据 webhook payload 回查 Stripe Session 失败, sessionId={}", sessionId, e);
            return null;
        }
    }

    private String extractSessionId(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            return root.path("data").path("object").path("id").asText(null);
        } catch (JsonProcessingException e) {
            log.warn("解析 Stripe webhook payload 中的 sessionId 失败", e);
            return null;
        }
    }

    private void ensureStripeConfigured() {
        if (!StringUtils.hasText(stripeProperties.getSecretKey())) {
            throw new RuntimeException("未配置 STRIPE_SECRET_KEY");
        }
        if (!StringUtils.hasText(stripeProperties.getSuccessUrl())) {
            throw new RuntimeException("未配置 STRIPE_SUCCESS_URL");
        }
        if (!StringUtils.hasText(stripeProperties.getCancelUrl())) {
            throw new RuntimeException("未配置 STRIPE_CANCEL_URL");
        }
    }

    private void ensureWebhookConfigured() {
        ensureStripeConfigured();
        if (!StringUtils.hasText(stripeProperties.getWebhookSecret())) {
            throw new RuntimeException("未配置 STRIPE_WEBHOOK_SECRET");
        }
    }

    private long toMinorAmount(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }

    private String buildBatchNo() {
        return "PB" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + RandomUtil.randomNumbers(6);
    }

    private LocalDateTime resolveBatchExpireTime(List<Order> orders) {
        return orders.stream()
                .map(Order::getPayExpireTime)
                .filter(expireTime -> expireTime != null)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now().plusMinutes(30));
    }

    private String writeOrderIds(List<Long> orderIds) {
        try {
            return objectMapper.writeValueAsString(orderIds.stream().distinct().sorted().toList());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("序列化订单列表失败");
        }
    }

    private List<Long> parseOrderIds(List<String> rawOrderIds) {
        if (rawOrderIds == null || rawOrderIds.isEmpty()) {
            return List.of();
        }

        List<Long> parsed = new ArrayList<>();
        for (String rawOrderId : rawOrderIds) {
            if (!StringUtils.hasText(rawOrderId)) {
                throw new RuntimeException("支付请求中的订单ID为空");
            }
            try {
                parsed.add(Long.parseLong(rawOrderId.trim()));
            } catch (NumberFormatException e) {
                throw new RuntimeException("支付请求中的订单ID格式非法: " + rawOrderId);
            }
        }
        return parsed;
    }

    private List<Long> parseOrderIds(String orderIdsJson) {
        try {
            return objectMapper.readValue(orderIdsJson, new TypeReference<List<Long>>() {});
        } catch (JsonProcessingException e) {
            throw new RuntimeException("解析支付批次订单列表失败");
        }
    }

    private String toDisplayStatus(Integer status) {
        if (BATCH_STATUS_PAID.equals(status)) {
            return "paid";
        }
        if (BATCH_STATUS_CANCELED.equals(status)) {
            return "canceled";
        }
        if (BATCH_STATUS_EXPIRED.equals(status)) {
            return "expired";
        }
        if (BATCH_STATUS_FAILED.equals(status)) {
            return "failed";
        }
        return "pending";
    }
}
