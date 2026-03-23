package com.zhijian.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.service.MedicineService;
import com.zhijian.common.annotation.AdminCheck;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.dto.medicine.MedicineQueryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员药品管理控制器。
 */
@Tag(name = "管理员-药品管理")
@RestController
@RequestMapping("/admin/medicine")
@AdminCheck
public class AdminMedicineController {

    @Resource
    private MedicineService medicineService;

    @Operation(summary = "管理员分页查询药品")
    @GetMapping("/list")
    public Result<IPage<Medicine>> list(MedicineQueryDTO query) {
        return Result.success(medicineService.pageListAdmin(query));
    }

    @Operation(summary = "管理员强制下架/上架")
    @PatchMapping("/{id}/status")
    public Result updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        medicineService.updateStatusByAdmin(id, status);
        return Result.success(null, "状态更新成功");
    }

    @Operation(summary = "批量上下架 (管理员)")
    @PatchMapping("/batch/status")
    public Result batchUpdateStatus(@RequestBody List<Long> ids, @RequestParam Integer status) {
        medicineService.batchUpdateStatus(ids, status);
        return Result.success(null, "批量更新成功");
    }

    @Operation(summary = "管理员删除药品")
    @DeleteMapping("/{id}")
    public Result delete(@PathVariable Long id) {
        medicineService.deleteByAdmin(id);
        return Result.success(null, "删除成功");
    }
}
