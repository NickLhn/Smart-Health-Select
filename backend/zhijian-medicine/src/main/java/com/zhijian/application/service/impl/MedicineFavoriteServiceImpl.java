package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.MedicineFavoriteService;
import com.zhijian.application.service.MedicineService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.medicine.entity.Medicine;
import com.zhijian.domain.medicine.entity.MedicineFavorite;
import com.zhijian.infrastructure.persistence.mapper.MedicineFavoriteMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 药品收藏服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
public class MedicineFavoriteServiceImpl extends ServiceImpl<MedicineFavoriteMapper, MedicineFavorite> implements MedicineFavoriteService {

    @Resource
    private MedicineService medicineService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result toggle(Long medicineId, Long userId) {
        Medicine medicine = medicineService.getById(medicineId);
        if (medicine == null) {
            return Result.failed("药品不存在");
        }

        LambdaQueryWrapper<MedicineFavorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MedicineFavorite::getUserId, userId)
                .eq(MedicineFavorite::getMedicineId, medicineId);
        
        MedicineFavorite favorite = this.getOne(wrapper);
        if (favorite != null) {
            // 已收藏，则取消收藏
            this.removeById(favorite.getId());
            return Result.success(false, "已取消收藏");
        } else {
            // 未收藏，则添加收藏
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
        
        // 转换结果，填充药品信息
        List<Long> medicineIds = favoritePage.getRecords().stream()
                .map(MedicineFavorite::getMedicineId)
                .collect(Collectors.toList());
        
        List<Medicine> medicines = new ArrayList<>();
        if (!medicineIds.isEmpty()) {
            medicines = medicineService.listByIds(medicineIds);
        }

        // 这里简单返回药品列表，实际项目中可能需要封装成 VO
        // 为了保持简单，直接返回 Medicine 对象，但在 Page 中替换 Records
        
        // 由于 IPage<T> 的类型限制，这里创建一个新的 Page 对象返回
        Page<Object> resultPage = new Page<>(page, size);
        resultPage.setTotal(favoritePage.getTotal());
        resultPage.setPages(favoritePage.getPages());
        resultPage.setRecords(new ArrayList<>(medicines));
        
        return resultPage;
    }
}
