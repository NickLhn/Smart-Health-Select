package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.pojo.OrderComment;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单评价数据访问接口。
 */
@Mapper
public interface OrderCommentMapper extends BaseMapper<OrderComment> {
}
