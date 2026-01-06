package com.zhijian.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.order.entity.OrderComment;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单评价 Mapper 接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface OrderCommentMapper extends BaseMapper<OrderComment> {
}
