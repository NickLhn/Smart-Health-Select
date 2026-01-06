package com.zhijian.application.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.domain.order.entity.Order;
import com.zhijian.domain.order.entity.PaymentRecord;

/**
 * 支付记录服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface PaymentRecordService extends IService<PaymentRecord> {

    /**
     * 创建支付记录
     * @param order 订单信息
     * @param paymentMethod 支付方式
     * @param transactionId 交易流水号
     */
    void createRecord(Order order, Integer paymentMethod, String transactionId);
}
