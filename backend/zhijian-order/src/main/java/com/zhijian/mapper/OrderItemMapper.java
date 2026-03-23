package com.zhijian.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhijian.dto.order.ProductSalesDTO;
import com.zhijian.pojo.OrderItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 订单项数据访问接口。
 */
@Mapper
public interface OrderItemMapper extends BaseMapper<OrderItem> {

    /**
     * 查询热销商品列表。
     *
     * @param limit 返回数量
     * @return 热销商品列表
     */
    @Select("SELECT medicine_id as medicineId, medicine_name as medicineName, SUM(count) as salesCount " +
            "FROM order_item " +
            "GROUP BY medicine_id, medicine_name " +
            "ORDER BY salesCount DESC " +
            "LIMIT #{limit}")
    List<ProductSalesDTO> selectTopProducts(@Param("limit") int limit);
}
