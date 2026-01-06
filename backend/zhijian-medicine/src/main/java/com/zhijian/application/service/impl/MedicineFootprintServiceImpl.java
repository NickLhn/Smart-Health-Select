package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.MedicineFootprintService;
import com.zhijian.application.service.MedicineService;
import com.zhijian.domain.medicine.entity.Medicine;
import com.zhijian.domain.medicine.entity.MedicineFootprint;
import com.zhijian.infrastructure.persistence.mapper.MedicineFootprintMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 药品足迹服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MedicineFootprintServiceImpl extends ServiceImpl<MedicineFootprintMapper, MedicineFootprint> implements MedicineFootprintService {

    private final MedicineService medicineService;

    @Async
    @Override
    public void record(Long userId, Long medicineId) {
        // 简单去重：如果最近一条是该商品，则更新时间；否则新增
        // 这里为了简化，直接查询当天是否有记录，如果有则更新时间，没有则新增
        // 或者更简单的策略：先删除该用户该商品的旧记录，再插入新记录，保证最新
        try {
            LambdaQueryWrapper<MedicineFootprint> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(MedicineFootprint::getUserId, userId);
            wrapper.eq(MedicineFootprint::getMedicineId, medicineId);
            this.remove(wrapper);

            MedicineFootprint footprint = new MedicineFootprint();
            footprint.setUserId(userId);
            footprint.setMedicineId(medicineId);
            this.save(footprint);
        } catch (Exception e) {
            log.error("记录足迹失败: userId={}, medicineId={}", userId, medicineId, e);
        }
    }

    @Override
    public IPage<Medicine> myFootprints(Long userId, Integer page, Integer size) {
        // 1. 分页查询足迹记录
        Page<MedicineFootprint> footprintPage = new Page<>(page, size);
        LambdaQueryWrapper<MedicineFootprint> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MedicineFootprint::getUserId, userId);
        wrapper.orderByDesc(MedicineFootprint::getCreateTime);
        
        this.page(footprintPage, wrapper);

        // 2. 获取药品ID列表
        List<Long> medicineIds = footprintPage.getRecords().stream()
                .map(MedicineFootprint::getMedicineId)
                .collect(Collectors.toList());

        // 3. 构造返回结果
        Page<Medicine> resultPage = new Page<>(page, size, footprintPage.getTotal());
        if (!medicineIds.isEmpty()) {
            List<Medicine> medicines = medicineService.listByIds(medicineIds);
            // 保持足迹顺序 (listByIds 不保证顺序)
            List<Medicine> sortedMedicines = medicineIds.stream()
                    .map(id -> medicines.stream().filter(m -> m.getId().equals(id)).findFirst().orElse(null))
                    .filter(m -> m != null)
                    .collect(Collectors.toList());
            resultPage.setRecords(sortedMedicines);
        }
        
        return resultPage;
    }
}
