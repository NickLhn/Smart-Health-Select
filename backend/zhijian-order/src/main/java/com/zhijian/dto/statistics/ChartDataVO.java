package com.zhijian.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 图表数据项视图对象。
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChartDataVO {

    /**
     * 名称。
     */
    private String name;

    /**
     * 值。
     */
    private Object value;
}
