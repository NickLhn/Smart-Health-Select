package com.zhijian.interfaces.dto.order;

import lombok.Data;

import java.io.Serializable;

/**
 * 商品销量统计 DTO
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
public class ProductSalesDTO implements Serializable {
    private Long medicineId;
    private String medicineName;
    private Integer salesCount;
}
