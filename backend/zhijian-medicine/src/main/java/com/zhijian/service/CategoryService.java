package com.zhijian.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.medicine.entity.Category;

import java.util.List;

/**
 * 药品分类服务接口。
 */
public interface CategoryService extends IService<Category> {

    /**
     * 查询分类树。
     *
     * @return 分类树列表
     */
    List<Category> listTree();

    /**
     * 添加分类。
     *
     * @param category 分类信息
     * @return 是否成功
     */
    boolean addCategory(Category category);
}
