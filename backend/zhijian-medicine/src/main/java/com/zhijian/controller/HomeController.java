package com.zhijian.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhijian.service.BannerService;
import com.zhijian.service.CategoryService;
import com.zhijian.service.HealthArticleService;
import com.zhijian.service.MedicineService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.medicine.entity.HealthArticle;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.dto.home.HomeIndexVO;
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
 * 首页数据控制器。
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

        // 首页聚合接口一次返回轮播图、分类、药品和资讯，减少前端串行请求。
        vo.setBanners(bannerService.listEnabled());

        vo.setCategories(categoryService.listTree());

        // 热门药品按销量倒序取前 5 个已上架商品。
        Page<Medicine> hotPage = medicineService.page(new Page<>(1, 5), 
                new LambdaQueryWrapper<Medicine>()
                        .eq(Medicine::getStatus, 1)
                        .orderByDesc(Medicine::getSales));
        vo.setHotMedicines(hotPage.getRecords());

        // 推荐位默认直接复用最新上架商品，避免首页没有内容。
        Page<Medicine> newArrivalsPage = medicineService.page(new Page<>(1, 5),
                new LambdaQueryWrapper<Medicine>()
                        .eq(Medicine::getStatus, 1)
                        .orderByDesc(Medicine::getCreateTime));
        
        List<Medicine> newArrivals = newArrivalsPage.getRecords();

        // 如果新品位没有数据，就随机兜底拿一批上架商品。
        if (newArrivals.isEmpty()) {
             Page<Medicine> randomPage = medicineService.page(new Page<>(1, 5),
                     new LambdaQueryWrapper<Medicine>()
                             .eq(Medicine::getStatus, 1)
                             .last("ORDER BY RAND()"));
             vo.setRecommendMedicines(randomPage.getRecords());
        } else {
            vo.setRecommendMedicines(newArrivals);
        }

        // 健康资讯区域固定取最新的 3 条启用文章。
        Page<HealthArticle> articlePage = healthArticleService.page(new Page<>(1, 3),
                new LambdaQueryWrapper<HealthArticle>()
                        .eq(HealthArticle::getStatus, 1)
                        .orderByDesc(HealthArticle::getCreateTime));
        vo.setHealthArticles(articlePage.getRecords());

        return Result.success(vo);
    }
}
