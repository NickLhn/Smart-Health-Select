package com.zhijian.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.mapper.PaymentBatchMapper;
import com.zhijian.pojo.PaymentBatch;
import com.zhijian.service.PaymentBatchService;
import org.springframework.stereotype.Service;

/**
 * 支付批次服务实现。
 */
@Service
public class PaymentBatchServiceImpl extends ServiceImpl<PaymentBatchMapper, PaymentBatch> implements PaymentBatchService {
}
