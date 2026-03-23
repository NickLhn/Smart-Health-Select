package com.zhijian.dto.order;

import lombok.Data;

import java.io.Serializable;

/**
 * 商品销量统计对象。
 */
@Data
public class ProductSalesDTO implements Serializable {

    /**
     * 药品 ID。
     */
    private Long medicineId;

    /**
     * 药品名称。
     */
    private String medicineName;

    /**
     * 销量。
     */
    private Integer salesCount;
}
