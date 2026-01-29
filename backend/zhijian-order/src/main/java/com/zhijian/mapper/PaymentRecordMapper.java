package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.PaymentRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * 支付记录 Mapper 接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface PaymentRecordMapper extends BaseMapper<PaymentRecord> {
}

