package com.zhijian.delivery.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.delivery.pojo.Delivery;
import org.apache.ibatis.annotations.Mapper;

/**
 * 配送单数据访问接口。
 */
@Mapper
public interface DeliveryMapper extends BaseMapper<Delivery> {
}
