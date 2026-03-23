package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.PaymentRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 支付记录数据访问接口。
 */
@Mapper
public interface PaymentRecordMapper extends BaseMapper<PaymentRecord> {
}
