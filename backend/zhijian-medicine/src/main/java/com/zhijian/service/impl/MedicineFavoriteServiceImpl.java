package com.zhijian.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.MedicineFavoriteService;
import com.zhijian.service.MedicineService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.pojo.medicine.entity.MedicineFavorite;
import com.zhijian.mapper.MedicineFavoriteMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicineFavoriteServiceImpl extends ServiceImpl<MedicineFavoriteMapper, MedicineFavorite> implements MedicineFavoriteService {

    @Resource
    private MedicineService medicineService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result toggle(Long medicineId, Long userId) {
        // 收藏前先确认药品存在。
        Medicine medicine = medicineService.getById(medicineId);
        if (medicine == null) {
            return Result.failed("药品不存在");
        }

        LambdaQueryWrapper<MedicineFavorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MedicineFavorite::getUserId, userId)
                .eq(MedicineFavorite::getMedicineId, medicineId);
        
        MedicineFavorite favorite = this.getOne(wrapper);
        if (favorite != null) {
            // 已收藏则取消收藏。
            this.removeById(favorite.getId());
            return Result.success(false, "已取消收藏");
        } else {
            // 未收藏则新增收藏记录。
            favorite = new MedicineFavorite();
            favorite.setUserId(userId);
            favorite.setMedicineId(medicineId);
            this.save(favorite);
            return Result.success(true, "收藏成功");
        }
    }

    @Override
    public boolean isFavorite(Long medicineId, Long userId) {
        if (userId == null) {
            return false;
        }
        return this.count(new LambdaQueryWrapper<MedicineFavorite>()
                .eq(MedicineFavorite::getUserId, userId)
                .eq(MedicineFavorite::getMedicineId, medicineId)) > 0;
    }

    @Override
    public IPage<Object> myList(Long userId, Integer page, Integer size) {
        Page<MedicineFavorite> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<MedicineFavorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MedicineFavorite::getUserId, userId)
                .orderByDesc(MedicineFavorite::getCreateTime);
        
        IPage<MedicineFavorite> favoritePage = this.page(pageParam, wrapper);
        
        // 把收藏记录补全为药品信息列表。
        List<Long> medicineIds = favoritePage.getRecords().stream()
                .map(MedicineFavorite::getMedicineId)
                .collect(Collectors.toList());
        
        List<Medicine> medicines = new ArrayList<>();
        if (!medicineIds.isEmpty()) {
            medicines = medicineService.listByIds(medicineIds);
        }

        // 这里直接返回药品列表，避免前端再做一次额外联查。
        Page<Object> resultPage = new Page<>(page, size);
        resultPage.setTotal(favoritePage.getTotal());
        resultPage.setPages(favoritePage.getPages());
        resultPage.setRecords(new ArrayList<>(medicines));
        
        return resultPage;
    }
}
