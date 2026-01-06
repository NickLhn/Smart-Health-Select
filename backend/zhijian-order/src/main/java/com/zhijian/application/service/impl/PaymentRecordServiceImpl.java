package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.PaymentRecordService;
import com.zhijian.domain.order.entity.Order;
import com.zhijian.domain.order.entity.PaymentRecord;
import com.zhijian.infrastructure.persistence.mapper.PaymentRecordMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 支付记录服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
public class PaymentRecordServiceImpl extends ServiceImpl<PaymentRecordMapper, PaymentRecord> implements PaymentRecordService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createRecord(Order order, Integer paymentMethod, String transactionId) {
        PaymentRecord record = new PaymentRecord();
        record.setOrderId(order.getId());
        record.setUserId(order.getUserId());
        record.setAmount(order.getTotalAmount());
        record.setPaymentMethod(paymentMethod);
        record.setTransactionId(transactionId);
        record.setStatus(1); // 默认成功
        this.save(record);
    }
}
