package com.zhijian.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.MedicineFootprintService;
import com.zhijian.service.MedicineService;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.pojo.medicine.entity.MedicineFootprint;
import com.zhijian.mapper.MedicineFootprintMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicineFootprintServiceImpl extends ServiceImpl<MedicineFootprintMapper, MedicineFootprint> implements MedicineFootprintService {

    private final MedicineService medicineService;

    @Async
    @Override
    public void record(Long userId, Long medicineId) {
        // 当前策略是“先删旧记录、再插入新记录”，保证足迹顺序始终以最近浏览为准。
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
        // 先分页查足迹记录。
        Page<MedicineFootprint> footprintPage = new Page<>(page, size);
        LambdaQueryWrapper<MedicineFootprint> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MedicineFootprint::getUserId, userId);
        wrapper.orderByDesc(MedicineFootprint::getCreateTime);
        
        this.page(footprintPage, wrapper);

        // 再提取足迹里的药品 ID。
        List<Long> medicineIds = footprintPage.getRecords().stream()
                .map(MedicineFootprint::getMedicineId)
                .collect(Collectors.toList());

        // 最终把药品实体按足迹顺序重新组装返回。
        Page<Medicine> resultPage = new Page<>(page, size, footprintPage.getTotal());
        if (!medicineIds.isEmpty()) {
            List<Medicine> medicines = medicineService.listByIds(medicineIds);
            // listByIds 不保证顺序，因此按足迹顺序手动重排。
            List<Medicine> sortedMedicines = medicineIds.stream()
                    .map(id -> medicines.stream().filter(m -> m.getId().equals(id)).findFirst().orElse(null))
                    .filter(m -> m != null)
                    .collect(Collectors.toList());
            resultPage.setRecords(sortedMedicines);
        }
        
        return resultPage;
    }
}
