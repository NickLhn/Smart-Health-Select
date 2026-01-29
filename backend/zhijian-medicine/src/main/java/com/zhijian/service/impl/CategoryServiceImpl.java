package com.zhijian.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.CategoryService;
import com.zhijian.pojo.medicine.entity.Category;
import com.zhijian.mapper.CategoryMapper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 药品分类服务实现类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements CategoryService {

    @Override
    public List<Category> listTree() {
        List<Category> all = this.list(new LambdaQueryWrapper<Category>()
                .orderByAsc(Category::getSort));
        return all.stream()
                .filter(category -> category.getParentId() == 0)
                .peek(category -> category.setChildren(getChildren(category, all)))
                .collect(java.util.stream.Collectors.toList());
    }

    private List<Category> getChildren(Category root, List<Category> all) {
        List<Category> children = all.stream()
                .filter(category -> category.getParentId().equals(root.getId()))
                .peek(category -> category.setChildren(getChildren(category, all)))
                .collect(java.util.stream.Collectors.toList());
        return children.isEmpty() ? null : children;
    }

    @Override
    public boolean addCategory(Category category) {
        if (category.getParentId() == null) {
            category.setParentId(0L);
            category.setLevel(1);
        } else {
            Category parent = this.getById(category.getParentId());
            if (parent != null) {
                category.setLevel(parent.getLevel() + 1);
            } else {
                category.setParentId(0L);
                category.setLevel(1);
            }
        }
        return this.save(category);
    }
}

