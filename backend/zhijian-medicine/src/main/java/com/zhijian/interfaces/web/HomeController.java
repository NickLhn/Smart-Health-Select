package com.zhijian.interfaces.web;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhijian.application.service.BannerService;
import com.zhijian.application.service.CategoryService;
import com.zhijian.application.service.HealthArticleService;
import com.zhijian.application.service.MedicineService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.medicine.entity.HealthArticle;
import com.zhijian.domain.medicine.entity.Medicine;
import com.zhijian.interfaces.dto.home.HomeIndexVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 首页数据控制器
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "首页管理")
@RestController
@RequestMapping("/home")
public class HomeController {

    @Resource
    private BannerService bannerService;

    @Resource
    private CategoryService categoryService;

    @Resource
    private MedicineService medicineService;

    @Resource
    private HealthArticleService healthArticleService;

    @Operation(summary = "获取首页聚合数据")
    @GetMapping("/index")
    public Result<HomeIndexVO> index() {
        HomeIndexVO vo = new HomeIndexVO();

        // 1. 获取轮播图
        vo.setBanners(bannerService.listEnabled());

        // 2. 获取分类树
        vo.setCategories(categoryService.listTree());

        // 3. 获取热门药品 (真实数据：按销量排序)
        Page<Medicine> hotPage = medicineService.page(new Page<>(1, 5), 
                new LambdaQueryWrapper<Medicine>()
                        .eq(Medicine::getStatus, 1) // 仅上架商品
                        .orderByDesc(Medicine::getSales));
        vo.setHotMedicines(hotPage.getRecords());

        // 4. 获取推荐药品/新品 (真实数据：按创建时间排序)
        // 直接获取最新的5个上架商品作为新品
        Page<Medicine> newArrivalsPage = medicineService.page(new Page<>(1, 5),
                new LambdaQueryWrapper<Medicine>()
                        .eq(Medicine::getStatus, 1)
                        .orderByDesc(Medicine::getCreateTime));
        
        List<Medicine> newArrivals = newArrivalsPage.getRecords();

        // 如果没有数据，尝试随机获取（通常意味着数据库为空或无上架商品）
        if (newArrivals.isEmpty()) {
             Page<Medicine> randomPage = medicineService.page(new Page<>(1, 5),
                     new LambdaQueryWrapper<Medicine>()
                             .eq(Medicine::getStatus, 1)
                             .last("ORDER BY RAND()"));
             vo.setRecommendMedicines(randomPage.getRecords());
        } else {
            vo.setRecommendMedicines(newArrivals);
        }

        // 5. 获取最新健康资讯 (取前3条)
        Page<HealthArticle> articlePage = healthArticleService.page(new Page<>(1, 3),
                new LambdaQueryWrapper<HealthArticle>()
                        .eq(HealthArticle::getStatus, 1)
                        .orderByDesc(HealthArticle::getCreateTime));
        vo.setHealthArticles(articlePage.getRecords());

        return Result.success(vo);
    }
}
