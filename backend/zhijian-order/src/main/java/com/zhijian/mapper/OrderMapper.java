package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.Order;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单数据访问接口。
 */
@Mapper
public interface OrderMapper extends BaseMapper<Order> {
}
