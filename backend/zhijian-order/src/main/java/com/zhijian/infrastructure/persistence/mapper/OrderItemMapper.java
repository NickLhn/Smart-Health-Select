package com.zhijian.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.domain.order.entity.OrderItem;
import com.zhijian.interfaces.dto.order.ProductSalesDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 订单详情 Mapper 接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Mapper
public interface OrderItemMapper extends BaseMapper<OrderItem> {

    @Select("SELECT medicine_id as medicineId, medicine_name as medicineName, SUM(count) as salesCount " +
            "FROM order_item " +
            "GROUP BY medicine_id, medicine_name " +
            "ORDER BY salesCount DESC " +
            "LIMIT #{limit}")
    List<ProductSalesDTO> selectTopProducts(@Param("limit") int limit);
}
