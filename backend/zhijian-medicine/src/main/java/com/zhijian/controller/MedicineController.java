package com.zhijian.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.service.MedicineService;
import com.zhijian.service.MedicineFootprintService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.dto.medicine.MedicineDTO;
import com.zhijian.dto.medicine.MedicineQueryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 药品管理控制器。
 * <p>
 * 提供商家端药品维护、用户端查询以及管理端药品管理能力。
 */
@Tag(name = "药品管理", description = "药品发布、搜索与详情")
@RestController
@RequestMapping("/medicine")
@RequiredArgsConstructor
public class MedicineController {

    /**
     * 药品业务服务。
     */
    private final MedicineService medicineService;

    /**
     * 药品足迹服务。
     */
    private final MedicineFootprintService footprintService;

    @Operation(summary = "发布药品 (商家)")
    @PostMapping
    public Result create(@RequestBody @Valid MedicineDTO dto) {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        // 发布药品只允许商家账号操作。
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("只有商家才能发布药品");
        }
        
        medicineService.createMedicine(dto, sellerId);
        return Result.success(null, "发布成功");
    }

    @Operation(summary = "修改药品 (商家)")
    @PutMapping("/{id}")
    public Result update(@PathVariable Long id, @RequestBody @Valid MedicineDTO dto) {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("只有商家才能操作药品");
        }
        medicineService.updateMedicine(id, dto, sellerId);
        return Result.success(null, "更新成功");
    }

    @Operation(summary = "药品上下架 (商家)")
    @PatchMapping("/{id}/status")
    public Result updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("只有商家才能操作药品");
        }
        medicineService.updateStatus(id, status, sellerId);
        return Result.success(null, "状态更新成功");
    }

    @Operation(summary = "分页搜索药品 (用户/公开)")
    @GetMapping("/list")
    public Result<IPage<Medicine>> list(MedicineQueryDTO query) {
        // 公开列表默认只展示上架商品。
        if (query.getStatus() == null) {
            query.setStatus(1);
        }
        return Result.success(medicineService.pageList(query));
    }

    @Operation(summary = "分页搜索药品 (商家我的商品)")
    @GetMapping("/merchant/list")
    public Result<IPage<Medicine>> listMerchant(MedicineQueryDTO query) {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("只有商家才能查看我的商品");
        }
        query.setSellerId(sellerId);
        return Result.success(medicineService.pageList(query));
    }

    @Operation(summary = "获取药品详情")
    @GetMapping("/{id}")
    public Result<Medicine> detail(@PathVariable Long id) {
        Medicine medicine = medicineService.getDetail(id);
        String role = UserContext.getRole();
        if (role == null) {
            role = "USER";
        }

        if ("SELLER".equalsIgnoreCase(role)) {
            // 商家只能查看自己店铺下的药品详情，避免越权读取其他商家的商品。
            Long sellerId = UserContext.getUserId();
            if (sellerId == null || medicine == null || !sellerId.equals(medicine.getSellerId())) {
                return Result.failed("药品不存在或无权查看");
            }
            return Result.success(medicine);
        }

        if (!"ADMIN".equalsIgnoreCase(role) && !"PHARMACIST".equalsIgnoreCase(role)) {
            // 普通用户只能看到已上架药品，并在登录状态下记录浏览足迹。
            if (medicine == null || medicine.getStatus() == null || medicine.getStatus() != 1) {
                return Result.failed("药品不存在");
            }
            Long userId = UserContext.getUserId();
            if (userId != null) {
                footprintService.record(userId, id);
            }
            return Result.success(medicine);
        }

        return Result.success(medicine);
    }

    @Operation(summary = "获取我的足迹")
    @GetMapping("/footprints")
    public Result<IPage<Medicine>> footprints(@RequestParam(defaultValue = "1") Integer page,
                                              @RequestParam(defaultValue = "10") Integer size) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return Result.success(footprintService.myFootprints(userId, page, size));
    }

    @Operation(summary = "分页搜索药品 (管理端)")
    @GetMapping("/admin/list")
    public Result<IPage<Medicine>> listAdmin(MedicineQueryDTO query) {
        // 这里允许管理员和药师查看全部药品数据。
        if (!"ADMIN".equals(UserContext.getRole()) && !"PHARMACIST".equals(UserContext.getRole())) {
            return Result.failed("无权访问");
        }
        return Result.success(medicineService.pageListAdmin(query));
    }

    @Operation(summary = "删除药品 (管理端)")
    @DeleteMapping("/admin/{id}")
    public Result deleteAdmin(@PathVariable Long id) {
        if (!"ADMIN".equals(UserContext.getRole())) {
            return Result.failed("无权操作");
        }
        medicineService.deleteByAdmin(id);
        return Result.success(null, "删除成功");
    }

    @Operation(summary = "删除药品 (商家/逻辑删除)")
    @DeleteMapping("/{id}")
    public Result deleteSeller(@PathVariable Long id) {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("只有商家才能操作药品");
        }
        medicineService.deleteBySeller(id, sellerId);
        return Result.success(null, "删除成功");
    }

    @Operation(summary = "修改药品状态 (管理端)")
    @PatchMapping("/admin/{id}/status")
    public Result updateStatusAdmin(@PathVariable Long id, @RequestParam Integer status) {
        if (!"ADMIN".equals(UserContext.getRole())) {
            return Result.failed("无权操作");
        }
        medicineService.updateStatusByAdmin(id, status);
        return Result.success(null, "状态更新成功");
    }
}
