package com.zhijian.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.Order;
import com.zhijian.pojo.PaymentRecord;

/**
 * 支付记录服务接口。
 */
public interface PaymentRecordService extends IService<PaymentRecord> {

    /**
     * 创建支付记录。
     *
     * @param order 订单信息
     * @param paymentMethod 支付方式
     * @param transactionId 交易流水号
     */
    void createRecord(Order order, Integer paymentMethod, String transactionId);
}
