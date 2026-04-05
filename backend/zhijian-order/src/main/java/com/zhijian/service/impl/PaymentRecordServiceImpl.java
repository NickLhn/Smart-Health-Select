package com.zhijian.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.mapper.PaymentRecordMapper;
import com.zhijian.pojo.Order;
import com.zhijian.pojo.PaymentRecord;
import com.zhijian.service.PaymentRecordService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 支付记录服务实现类。
 */
@Service
public class PaymentRecordServiceImpl extends ServiceImpl<PaymentRecordMapper, PaymentRecord> implements PaymentRecordService {

    /**
     * 创建支付记录。
     *
     * @param order 订单信息
     * @param paymentMethod 支付方式
     * @param transactionId 交易流水号
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createRecord(
            Order order,
            Integer paymentMethod,
            String transactionId,
            String provider,
            String currency,
            String checkoutSessionId,
            String paymentIntentId,
            String providerStatus
    ) {
        // 无论是 mock 还是 Stripe sandbox，都统一沉淀一条支付流水，便于后续排障和对账。
        PaymentRecord record = new PaymentRecord();
        record.setOrderId(order.getId());
        record.setUserId(order.getUserId());
        // 这里记录实付金额，而不是商品原价，避免优惠券场景下金额失真。
        record.setAmount(order.getPayAmount());
        record.setPaymentMethod(paymentMethod);
        record.setProvider(provider);
        record.setTransactionId(transactionId);
        record.setCheckoutSessionId(checkoutSessionId);
        record.setPaymentIntentId(paymentIntentId);
        record.setStatus(1);
        record.setProviderStatus(providerStatus);
        record.setCurrency(currency);
        this.save(record);
    }
}
