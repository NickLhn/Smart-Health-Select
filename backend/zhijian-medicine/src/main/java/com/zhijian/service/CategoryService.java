package com.zhijian.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.medicine.entity.Category;

import java.util.List;

/**
 * 药品分类服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface CategoryService extends IService<Category> {

    /**
     * 获取所有分类（树形结构）
     * @return 分类列表
     */
    List<Category> listTree();

    /**
     * 添加分类
     * @param category 分类信息
     * @return 是否成功
     */
    boolean addCategory(Category category);
}

