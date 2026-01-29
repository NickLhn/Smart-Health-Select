package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.delivery.entity.Delivery;
import org.apache.ibatis.annotations.Mapper;

/**
 * 配送单 Mapper
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface DeliveryMapper extends BaseMapper<Delivery> {
}

