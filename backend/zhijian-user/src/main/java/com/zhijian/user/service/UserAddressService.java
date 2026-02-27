package com.zhijian.user.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.pojo.user.entity.UserAddress;

import java.util.List;

/**
 * 用户收货地址服务接口
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface UserAddressService extends IService<UserAddress> {

    /**
     * 获取我的地址列表
     * @param userId 用户ID
     * @return 地址列表
     */
    List<UserAddress> myList(Long userId);

    /**
     * 添加地址
     * @param address 地址信息
     * @return 是否成功
     */
    boolean addAddress(UserAddress address);

    /**
     * 修改地址
     * @param address 地址信息
     * @return 是否成功
     */
    boolean updateAddress(UserAddress address);

    /**
     * 设置默认地址
     * @param id 地址ID
     * @param userId 用户ID
     * @return 是否成功
     */
    boolean setDefault(Long id, Long userId);
}

