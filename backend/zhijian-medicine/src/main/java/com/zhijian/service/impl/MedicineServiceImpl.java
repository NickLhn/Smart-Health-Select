package com.zhijian.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.MedicineService;
import com.zhijian.pojo.medicine.entity.Category;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.mapper.CategoryMapper;
import com.zhijian.mapper.MedicineMapper;
import com.zhijian.mapper.MerchantMapper;
import com.zhijian.pojo.user.entity.Merchant;
import com.zhijian.dto.medicine.MedicineDTO;
import com.zhijian.dto.medicine.MedicineQueryDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scripting.support.ResourceScriptSource;
import org.springframework.core.io.ClassPathResource;
import jakarta.annotation.PostConstruct;
import java.util.Collections;
import java.util.concurrent.TimeUnit;
import java.util.Random;

/**
 * 药品服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MedicineServiceImpl extends ServiceImpl<MedicineMapper, Medicine> implements MedicineService {

    private final MedicineMapper medicineMapper;
    private final CategoryMapper categoryMapper;
    private final MerchantMapper merchantMapper;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_KEY_PREFIX = "medicine:detail:";
    private static final String STOCK_KEY_PREFIX = "medicine:stock:";
    private static final long CACHE_TTL = 1L; // 1小时
    private static final TimeUnit CACHE_TTL_UNIT = TimeUnit.HOURS;

    private DefaultRedisScript<Long> stockDeductScript;

    @PostConstruct
    public void init() {
        stockDeductScript = new DefaultRedisScript<>();
        stockDeductScript.setScriptSource(new ResourceScriptSource(new ClassPathResource("scripts/stock_deduct.lua")));
        stockDeductScript.setResultType(Long.class);
    }

    @Override
    public boolean createMedicine(MedicineDTO dto, Long sellerId) {
        Medicine medicine = new Medicine();
        BeanUtil.copyProperties(dto, medicine);
        medicine.setSellerId(sellerId);
        // 设置分类ID
        medicine.setCategoryId(dto.getCategoryId());
        medicine.setStatus(1); // 默认上架
        medicine.setSales(0); // 默认销量为0
        medicine.setDeleted(0);
        boolean success = medicineMapper.insert(medicine) > 0;
        if (success) {
            // 虽然是新增，但为了保险起见，如果之前有缓存穿透留下的空值，删掉它
            deleteCache(medicine.getId());
            // 初始化Redis库存
            updateStockCache(medicine.getId(), medicine.getStock());
        }
        return success;
    }

    @Override
    public boolean updateMedicine(Long id, MedicineDTO dto, Long sellerId) {
        Medicine medicine = medicineMapper.selectById(id);
        if (medicine == null || !medicine.getSellerId().equals(sellerId) || Integer.valueOf(1).equals(medicine.getDeleted())) {
            throw new RuntimeException("药品不存在或无权操作");
        }
        BeanUtil.copyProperties(dto, medicine);
        medicine.setId(id); // 确保ID不被覆盖
        boolean success = medicineMapper.updateById(medicine) > 0;
        if (success) {
            deleteCache(id);
            // 更新Redis库存
            if (dto.getStock() != null) {
                updateStockCache(id, dto.getStock());
            }
        }
        return success;
    }

    @Override
    public IPage<Medicine> pageList(MedicineQueryDTO query) {
        Page<Medicine> page = new Page<>(query.getPage(), query.getSize());
        LambdaQueryWrapper<Medicine> wrapper = new LambdaQueryWrapper<>();
        
        wrapper.eq(Medicine::getDeleted, 0);
        if (StrUtil.isNotBlank(query.getKeyword())) {
            wrapper.and(w -> w.like(Medicine::getName, query.getKeyword())
                    .or()
                    .like(Medicine::getIndication, query.getKeyword()));
        }
        
        wrapper.eq(query.getCategoryId() != null, Medicine::getCategoryId, query.getCategoryId());
        wrapper.eq(query.getSellerId() != null, Medicine::getSellerId, query.getSellerId());
        wrapper.eq(query.getIsPrescription() != null, Medicine::getIsPrescription, query.getIsPrescription());
        // 如果有状态参数，则匹配状态
        wrapper.eq(query.getStatus() != null, Medicine::getStatus, query.getStatus());

        // 解析前端传入的 sort 参数 (e.g. price_asc)
        if (StrUtil.isBlank(query.getSortBy()) && StrUtil.isNotBlank(query.getSort())) {
            String[] parts = query.getSort().split("_");
            if (parts.length == 2) {
                query.setSortBy(parts[0]);
                query.setSortOrder(parts[1]);
            }
        }
        
        // 排序逻辑
        if (StrUtil.isNotBlank(query.getSortBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getSortOrder());
            if ("price".equalsIgnoreCase(query.getSortBy())) {
                wrapper.orderBy(true, isAsc, Medicine::getPrice);
            } else if ("sales".equalsIgnoreCase(query.getSortBy())) {
                wrapper.orderBy(true, isAsc, Medicine::getSales);
            }
        } else {
            // 默认按创建时间降序
            wrapper.orderByDesc(Medicine::getCreateTime);
        }

        IPage<Medicine> result = medicineMapper.selectPage(page, wrapper);
        populateCategoryName(result.getRecords());
        return result;
    }

    @Override
    public Medicine getDetail(Long id) {
        String key = CACHE_KEY_PREFIX + id;
        
        // 1. 尝试从缓存获取
        try {
            String json = stringRedisTemplate.opsForValue().get(key);
            if (StrUtil.isNotBlank(json)) {
                // 防穿透：如果是空字符串标记，直接返回null
                if ("NULL".equals(json)) {
                    return null;
                }
                return objectMapper.readValue(json, Medicine.class);
            }
        } catch (Exception e) {
            log.warn("Redis get error: {}", e.getMessage());
        }

        // 2. 缓存未命中，查询数据库
        Medicine medicine = medicineMapper.selectById(id);
        
        if (medicine != null && !Integer.valueOf(1).equals(medicine.getDeleted())) {
            Category category = categoryMapper.selectById(medicine.getCategoryId());
            if (category != null) {
                medicine.setCategoryName(category.getName());
            }
            // 填充商家名称
            if (medicine.getSellerId() != null) {
                Merchant merchant = merchantMapper.selectOne(new LambdaQueryWrapper<Merchant>()
                        .eq(Merchant::getUserId, medicine.getSellerId()));
                if (merchant != null) {
                    medicine.setSellerName(merchant.getShopName());
                }
            }
            
            // 3. 写入缓存 (加上随机过期时间，防止雪崩)
            try {
                long ttl = CACHE_TTL * 60 * 60 + new Random().nextInt(300); // 1小时 + 随机0-300秒
                stringRedisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(medicine), ttl, TimeUnit.SECONDS);
            } catch (Exception e) {
                log.warn("Redis set error: {}", e.getMessage());
            }
        } else {
            // 4. 防穿透：数据库不存在，缓存空值 (短时间)
            try {
                stringRedisTemplate.opsForValue().set(key, "NULL", 5, TimeUnit.MINUTES);
            } catch (Exception e) {
                log.warn("Redis set NULL error: {}", e.getMessage());
            }
        }
        
        return medicine;
    }

    @Override
    public boolean updateStatus(Long id, Integer status, Long sellerId) {
        Medicine medicine = medicineMapper.selectById(id);
        if (medicine == null || !medicine.getSellerId().equals(sellerId) || Integer.valueOf(1).equals(medicine.getDeleted())) {
            throw new RuntimeException("药品不存在或无权操作");
        }
        medicine.setStatus(status);
        boolean success = medicineMapper.updateById(medicine) > 0;
        if (success) {
            deleteCache(id);
        }
        return success;
    }

    @Override
    public IPage<Medicine> pageListAdmin(MedicineQueryDTO query) {
        Page<Medicine> page = new Page<>(query.getPage(), query.getSize());
        LambdaQueryWrapper<Medicine> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Medicine::getDeleted, 0);
        
        if (StrUtil.isNotBlank(query.getKeyword())) {
            wrapper.and(w -> w.like(Medicine::getName, query.getKeyword())
                    .or()
                    .like(Medicine::getIndication, query.getKeyword()));
        }

        wrapper.eq(query.getCategoryId() != null, Medicine::getCategoryId, query.getCategoryId());
        wrapper.eq(query.getIsPrescription() != null, Medicine::getIsPrescription, query.getIsPrescription());
        // 管理员查询，如果有指定状态则过滤，否则不过滤(查所有)
        wrapper.eq(query.getStatus() != null, Medicine::getStatus, query.getStatus());
        
        // 排序逻辑 (复用)
        if (StrUtil.isNotBlank(query.getSortBy())) {
            boolean isAsc = "asc".equalsIgnoreCase(query.getSortOrder());
            if ("price".equalsIgnoreCase(query.getSortBy())) {
                wrapper.orderBy(true, isAsc, Medicine::getPrice);
            } else if ("sales".equalsIgnoreCase(query.getSortBy())) {
                wrapper.orderBy(true, isAsc, Medicine::getSales);
            }
        } else {
            wrapper.orderByDesc(Medicine::getCreateTime);
        }

        IPage<Medicine> result = medicineMapper.selectPage(page, wrapper);
        populateCategoryName(result.getRecords());
        populateSellerName(result.getRecords());
        return result;
    }

    @Override
    public boolean updateStatusByAdmin(Long id, Integer status) {
        Medicine medicine = medicineMapper.selectById(id);
        if (medicine == null || Integer.valueOf(1).equals(medicine.getDeleted())) {
            throw new RuntimeException("药品不存在");
        }
        medicine.setStatus(status);
        boolean success = medicineMapper.updateById(medicine) > 0;
        if (success) {
            deleteCache(id);
        }
        return success;
    }

    @Override
    public boolean batchUpdateStatus(List<Long> ids, Integer status) {
        if (ids == null || ids.isEmpty()) {
            return false;
        }
        return update(new LambdaUpdateWrapper<Medicine>()
                .in(Medicine::getId, ids)
                .eq(Medicine::getDeleted, 0)
                .set(Medicine::getStatus, status));
    }

    @Override
    public boolean deleteByAdmin(Long id) {
        Medicine medicine = medicineMapper.selectById(id);
        if (medicine == null || Integer.valueOf(1).equals(medicine.getDeleted())) {
            return false;
        }
        medicine.setStatus(0);
        medicine.setDeleted(1);
        boolean success = medicineMapper.updateById(medicine) > 0;
        if (success) {
            deleteCache(id);
            deleteStockCache(id);
        }
        return success;
    }

    @Override
    public boolean deleteBySeller(Long id, Long sellerId) {
        Medicine medicine = medicineMapper.selectById(id);
        if (medicine == null || !medicine.getSellerId().equals(sellerId) || Integer.valueOf(1).equals(medicine.getDeleted())) {
            throw new RuntimeException("药品不存在或无权操作");
        }
        medicine.setStatus(0);
        medicine.setDeleted(1);
        boolean success = medicineMapper.updateById(medicine) > 0;
        if (success) {
            deleteCache(id);
            deleteStockCache(id);
        }
        return success;
    }

    /**
     * 删除缓存
     */
    private void deleteCache(Long id) {
        String key = CACHE_KEY_PREFIX + id;
        stringRedisTemplate.delete(key);
    }

    private void deleteStockCache(Long id) {
        String key = STOCK_KEY_PREFIX + id;
        stringRedisTemplate.delete(key);
    }

    /**
     * 更新Redis库存
     */
    private void updateStockCache(Long id, Integer stock) {
        String key = STOCK_KEY_PREFIX + id;
        stringRedisTemplate.opsForValue().set(key, String.valueOf(stock));
    }

    @Override
    public boolean deductStock(Long medicineId, Integer count) {
        String key = STOCK_KEY_PREFIX + medicineId;
        
        // 执行 Lua 脚本
        Long result = stringRedisTemplate.execute(stockDeductScript, Collections.singletonList(key), String.valueOf(count));
        
        // 如果Key不存在 (返回 -1)，则从数据库加载并重试
        if (result == -1) {
            Medicine medicine = this.getById(medicineId);
            if (medicine == null) {
                log.error("Medicine not found for deductStock: {}", medicineId);
                return false;
            }
            updateStockCache(medicineId, medicine.getStock());
            // 重试
            result = stringRedisTemplate.execute(stockDeductScript, Collections.singletonList(key), String.valueOf(count));
        }
        
        if (result == 1) {
            // Redis 扣减成功，同步更新数据库
            // 这里为了简单，直接执行 SQL update set stock = stock - count
            // 生产环境建议发送 MQ 异步扣减
            boolean updateDb = this.update().setSql("stock = stock - " + count)
                    .eq("id", medicineId)
                    .update();
            if (!updateDb) {
                log.error("Stock deducted in Redis but failed in DB! MedicineId: {}", medicineId);
                // 此时数据不一致，Redis库存少，DB库存多。
                // 简单的补偿：把 Redis 库存加回去 (或者不做处理，以此为准)
                // stringRedisTemplate.opsForValue().increment(key, count);
            }
            return true;
        }
        
        return false;
    }

    @Override
    public boolean restoreStock(Long medicineId, Integer count) {
        String key = STOCK_KEY_PREFIX + medicineId;
        
        // 1. 恢复 Redis 库存
        if (Boolean.FALSE.equals(stringRedisTemplate.hasKey(key))) {
             Medicine medicine = this.getById(medicineId);
             if (medicine != null) {
                 updateStockCache(medicineId, medicine.getStock());
             }
        }
        stringRedisTemplate.opsForValue().increment(key, count);
        
        // 2. 恢复 DB 库存
        return this.update().setSql("stock = stock + " + count)
                .eq("id", medicineId)
                .update();
    }

    /**
     * 填充分类名称
     */
    private void populateCategoryName(List<Medicine> records) {
        if (records == null || records.isEmpty()) {
            return;
        }
        
        // 获取所有分类ID
        Set<Long> categoryIds = records.stream()
                .map(Medicine::getCategoryId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        
        if (categoryIds.isEmpty()) {
            return;
        }
        
        // 批量查询分类
        List<Category> categories = categoryMapper.selectBatchIds(categoryIds);
        Map<Long, String> categoryMap = categories.stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));
        
        // 填充分类名称
        records.forEach(medicine -> {
            if (medicine.getCategoryId() != null) {
                medicine.setCategoryName(categoryMap.get(medicine.getCategoryId()));
            }
        });
    }

    /**
     * 填充商家名称
     */
    private void populateSellerName(List<Medicine> records) {
        if (records == null || records.isEmpty()) {
            return;
        }

        // 获取所有商家ID (这里是userId)
        Set<Long> userIds = records.stream()
                .map(Medicine::getSellerId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());

        if (userIds.isEmpty()) {
            return;
        }

        // 批量查询商家
        List<Merchant> merchants = merchantMapper.selectList(new LambdaQueryWrapper<Merchant>()
                .in(Merchant::getUserId, userIds));

        Map<Long, String> merchantMap = merchants.stream()
                .collect(Collectors.toMap(Merchant::getUserId, Merchant::getShopName));

        // 填充商家名称
        records.forEach(medicine -> {
            if (medicine.getSellerId() != null) {
                medicine.setSellerName(merchantMap.get(medicine.getSellerId()));
            }
        });
    }
}

