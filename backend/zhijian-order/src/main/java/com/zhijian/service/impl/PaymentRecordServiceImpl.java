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
    public void createRecord(Order order, Integer paymentMethod, String transactionId) {
        // 当前项目采用模拟支付，但仍保留支付记录，方便后续接真实支付渠道。
        PaymentRecord record = new PaymentRecord();
        record.setOrderId(order.getId());
        record.setUserId(order.getUserId());
        record.setAmount(order.getTotalAmount());
        record.setPaymentMethod(paymentMethod);
        record.setTransactionId(transactionId);
        record.setStatus(1);
        this.save(record);
    }
}
