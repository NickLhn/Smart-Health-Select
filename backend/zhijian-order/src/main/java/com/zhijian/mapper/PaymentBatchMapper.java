package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.PaymentBatch;
import org.apache.ibatis.annotations.Mapper;

/**
 * 支付批次数据访问接口。
 */
@Mapper
public interface PaymentBatchMapper extends BaseMapper<PaymentBatch> {
}
