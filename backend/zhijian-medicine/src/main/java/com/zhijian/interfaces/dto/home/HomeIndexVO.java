package com.zhijian.interfaces.dto.home;

import com.zhijian.domain.medicine.entity.Banner;
import com.zhijian.domain.medicine.entity.Category;
import com.zhijian.domain.medicine.entity.HealthArticle;
import com.zhijian.domain.medicine.entity.Medicine;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 首页数据 VO
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "首页聚合数据")
public class HomeIndexVO {

    @Schema(description = "轮播图列表")
    private List<Banner> banners;

    @Schema(description = "药品分类树")
    private List<Category> categories;

    @Schema(description = "热门药品列表")
    private List<Medicine> hotMedicines;

    @Schema(description = "推荐药品列表")
    private List<Medicine> recommendMedicines;

    @Schema(description = "健康资讯列表")
    private List<HealthArticle> healthArticles;
}
