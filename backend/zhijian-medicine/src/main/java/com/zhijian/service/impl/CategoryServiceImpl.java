package com.zhijian.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.service.CategoryService;
import com.zhijian.pojo.medicine.entity.Category;
import com.zhijian.mapper.CategoryMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements CategoryService {

    @Override
    public List<Category> listTree() {
        // 先查出全部分类，再在内存里组装树结构。
        List<Category> all = this.list(new LambdaQueryWrapper<Category>()
                .orderByAsc(Category::getSort));
        return all.stream()
                .filter(category -> category.getParentId() == 0)
                .peek(category -> category.setChildren(getChildren(category, all)))
                .collect(java.util.stream.Collectors.toList());
    }

    private List<Category> getChildren(Category root, List<Category> all) {
        // 递归构造当前分类节点的子节点。
        List<Category> children = all.stream()
                .filter(category -> category.getParentId().equals(root.getId()))
                .peek(category -> category.setChildren(getChildren(category, all)))
                .collect(java.util.stream.Collectors.toList());
        return children.isEmpty() ? null : children;
    }

    @Override
    public boolean addCategory(Category category) {
        // 新增分类时根据父节点推断层级；没有父节点时视为一级分类。
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
