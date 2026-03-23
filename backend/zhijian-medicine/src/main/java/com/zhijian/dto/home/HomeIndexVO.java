package com.zhijian.dto.home;

import com.zhijian.pojo.medicine.entity.Banner;
import com.zhijian.pojo.medicine.entity.Category;
import com.zhijian.pojo.medicine.entity.HealthArticle;
import com.zhijian.pojo.medicine.entity.Medicine;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 首页聚合数据视图对象。
 */
@Data
@Schema(description = "首页聚合数据")
public class HomeIndexVO {

    /**
     * 轮播图列表。
     */
    @Schema(description = "轮播图列表")
    private List<Banner> banners;

    /**
     * 药品分类树。
     */
    @Schema(description = "药品分类树")
    private List<Category> categories;

    /**
     * 热门药品列表。
     */
    @Schema(description = "热门药品列表")
    private List<Medicine> hotMedicines;

    /**
     * 推荐药品列表。
     */
    @Schema(description = "推荐药品列表")
    private List<Medicine> recommendMedicines;

    /**
     * 健康资讯列表。
     */
    @Schema(description = "健康资讯列表")
    private List<HealthArticle> healthArticles;
}
